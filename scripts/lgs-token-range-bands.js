// =============== Initialization and World Settings ===============
Hooks.once("init", () => {
  console.log("lgs-token-range-bands | Initializing...");

  // Register a world setting to store the distance configuration (the range bands)
  game.settings.register("lgs-token-range-bands", "distanceConfig", {
    name: "Distance Configuration",
    scope: "world",
    config: false,
    type: Object,
    default: []
  });

  // Register a client (world) setting for the default size multiplier.
  // This value is used when a new scene is created to set the "Range Band Multiplier" flag.
  game.settings.register("lgs-token-range-bands", "sizeMultiplier", {
    name: "Size Multiplier",
    hint: "The default value for determining relative size of range bands relative to grid/token size. Change based on expected scale of maps. Recommend values between 5-10. Individual scenes are customizable via Scene Configuration",
    scope: "client",
    config: true,
    default: 5,
    type: Number
  });

  game.settings.register("lgs-token-range-bands", "exceedRangeMessage", {
    name: "Exceeds Range Message",
    hint: "The message to be shown when narrative drag ruler exceeds maximum range",
    scope: "client",
    config: true,
    default: "Exceeds Range",
    type: String
  });

  // Register a settings menu to configure the distance ranges.
  game.settings.registerMenu("lgs-token-range-bands", "distanceConfigMenu", {
    name: "Configure Distance Ranges",
    label: "Configure",
    hint: "Set up the narrative range distance categories.",
    icon: "fas fa-ruler-combined",
    type: DistanceConfigApp,
    restricted: true
  });
  
  game.settings.register("lgs-token-range-bands", "dragRulerApproximation", {
    name: "Drag Ruler Approximation",
    hint: "When grid type is 'square' attempts to compensate for system Euclidean calculations so that drag ruler approximates range bands on diagonal measurements. This has no effect if scene grid type is not 'Square'.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Wrap the ruler’s segment label function so that the configured ranges are multiplied
  // by the scene’s rangeBandMultiplier flag.
  libWrapper.register(
    "lgs-token-range-bands",
    "Ruler.prototype._getSegmentLabel",
    function (wrapped, ...args) {
      // Call the original method to get the label which includes the measured distance.
      const originalLabel = wrapped(...args);
      const distances = game.settings.get("lgs-token-range-bands", "distanceConfig");
      const exceedsRangeMessage = game.settings.get("lgs-token-range-bands", "exceedRangeMessage");
      let narrativeLabel = "Range Exceeded";

      // Retrieve the Range Band Multiplier from the active scene (default to 1 if not set).
      const multiplier = canvas.scene?.getFlag("lgs-token-range-bands", "rangeBandMultiplier") || 1;

      // Retrieve the measurement display option from the active scene flag (default to "narrative")
      const measurementOption = canvas.scene?.getFlag("lgs-token-range-bands", "measurementOption") || "narrative";

      // Get the drag ruler approximation setting.
      const useApprox = game.settings.get("lgs-token-range-bands", "dragRulerApproximation");
      const activeScene = game.scenes.active;
      const gridtype = activeScene.grid.type;

      let measuredDistance = parseFloat(originalLabel.match(/([\d.]+)/)?.[1] || 0);

      if (useApprox && gridtype == 1) {
        // --- APPROXIMATION LOGIC FOR DIAGONALS ---
        let angleAdjustment = 1;
        const segment = args[0];
        if (segment && segment.ray) {
          const dx = Math.abs(segment.ray.dx);
          const dy = Math.abs(segment.ray.dy);
          if (dx !== 0 || dy !== 0) {
            const angle = Math.atan2(dy, dx);
            const diff = Math.min(angle, Math.abs(Math.PI / 2 - angle));
            const t = diff / (Math.PI / 4);
            angleAdjustment = 1 - t * (1 - 0.71875);
          }
        }
        for (let { name, distance } of distances.sort((a, b) => a.distance - b.distance)) {
          const effectiveThreshold = distance * multiplier * angleAdjustment;
          if (measuredDistance <= effectiveThreshold) {
            narrativeLabel = name;
            break;
          }
        }
      } else {
        // --- ORIGINAL LOGIC (No Diagonal Compensation) ---
        for (let { name, distance } of distances.sort((a, b) => a.distance - b.distance)) {
          if (measuredDistance <= (distance * multiplier)) {
            narrativeLabel = name;
            break;
          }
        }
      }
      
      // set color if range exceeded
      if (narrativeLabel == "Range Exceeded" ) {
        args[0].label._tintRGB = 721024 ; // dark red
        narrativeLabel = exceedsRangeMessage;
      } else {
        args[0].label._tintRGB = 16777215;  // white
      }
      
      // Return the label based on the measurement option.
      // "narrative"  => Narrative Drag Ruler Only (narrative text only)
      // "addToMeasurements" => Add to Measurements (numeric + narrative)
      // "numeric"    => Only Numeric Measurements Only (numeric only)
      switch(measurementOption) {
        case "addToMeasurements":
          return `${originalLabel}\n${narrativeLabel}`;
        case "numeric":
          return originalLabel;
        case "narrative":
        default:
          return narrativeLabel;
      }
    },
    "WRAPPER"
  );
});

// =============== Distance Configuration Dialog (with Drag & Drop and Reset Button) ===============
class DistanceConfigApp extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "distance-config",
      title: "Distance Configuration",
      template: "modules/lgs-token-range-bands/templates/distance-config.html",
      width: 500,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    // Always return an array for distances—even if empty.
    const distances = game.settings.get("lgs-token-range-bands", "distanceConfig") || [];
    return { distances };
  }

  async _updateObject(event, formData) {
    let distances = [];
    // Ensure values are arrays even if only one row exists.
    if (!Array.isArray(formData.name)) {
      formData.name = [formData.name];
      formData.distance = [formData.distance];
    }
    for (let i = 0; i < formData.name.length; i++) {
      distances.push({ name: formData.name[i], distance: Number(formData.distance[i]) });
    }
    await game.settings.set("lgs-token-range-bands", "distanceConfig", distances);
  }

  activateListeners(html) {
    super.activateListeners(html);
    const app = this;
    let dragged = null;

    // Helper: attach HTML5 drag-and-drop events to a row.
    function attachDragEvents(row) {
      row.attr('draggable', true);
      row.on('dragstart', (ev) => {
        dragged = ev.currentTarget;
        $(dragged).addClass('dragging');
      });
      row.on('dragend', (ev) => {
        $(dragged).removeClass('dragging');
        dragged = null;
      });
      row.on('dragover', (ev) => {
        ev.preventDefault();
      });
      row.on('drop', (ev) => {
        ev.preventDefault();
        const target = ev.currentTarget;
        if (dragged && target !== dragged) {
          // Insert the dragged row before the target row.
          $(dragged).insertBefore(target);
          app.setPosition();
        }
      });
    }

    // Attach drag events to all existing rows.
    html.find('.distance-row').each((i, row) => {
      attachDragEvents($(row));
    });

    // Handle the Add Row button.
    html.find('.add-row').click(ev => {
      const newRow = $(`
        <div class="distance-row" style="padding-left:20px; cursor: move; margin-bottom: 5px;" draggable="true">
          <input type="text" name="name" placeholder="Name" value="" style="width:291px; margin-right:5px;">
          <input type="number" name="distance" placeholder="Distance" value="" style="width:146px; margin-right:5px;">
          <i class="fas fa-trash remove-row" style="cursor:pointer;"></i>
        </div>
      `);
      html.find('.distance-rows').append(newRow);
      attachDragEvents(newRow);
      app.setPosition();
    });

    // Handle the Reset Ranges button.
    html.find('.reset-ranges').click(ev => {
      // Define the default ranges.
      const defaultRanges = [
        { name: "Short Range",   distance: 2 },
        { name: "Medium Range",  distance: 5 },
        { name: "Long Range",    distance: 10 },
        { name: "Extreme Range", distance: 20 }
      ];
      // Remove all rows except the header (assumed to be the first .distance-row).
      const $rowsContainer = html.find('.distance-rows');
      $rowsContainer.find('.distance-row:gt(0)').remove();

      // Append a row for each default range.
      for (let range of defaultRanges) {
        const newRow = $(`
          <div class="distance-row" style="padding-left:20px; cursor: move; margin-bottom: 5px;" draggable="true">
            <input type="text" name="name" placeholder="Name" value="${range.name}" style="width:291px; margin-right:5px;">
            <input type="number" name="distance" placeholder="Distance" value="${range.distance}" style="width:146px; margin-right:5px;">
            <i class="fas fa-trash remove-row" style="cursor:pointer;"></i>
          </div>
        `);
        $rowsContainer.append(newRow);
        attachDragEvents(newRow);
      }
      app.setPosition();
    });

    // Handle removal of a row.
    html.on('click', '.remove-row', ev => {
      $(ev.currentTarget).closest('.distance-row').remove();
      app.setPosition();
    });
  }
}

// Initialize the distance configuration if needed.
Hooks.once("ready", async () => {
  if (!game.settings.get("lgs-token-range-bands", "distanceConfig")) {
    await game.settings.set("lgs-token-range-bands", "distanceConfig", []);
  }
});

// =============== Modify Scene Configuration Dialog ===============
Hooks.on("renderSceneConfig", (app, html, data) => {
  // Only modify Scene configuration dialogs (their id starts with "SceneConfig-Scene")
  if (app.id && app.id.startsWith("SceneConfig-Scene")) {
    const gridTab = html.find('div[data-tab="grid"]');
    // Retrieve the stored Range Band Multiplier (or default to the sizeMultiplier setting)
    const rangeBandMultiplier = app.object.getFlag("lgs-token-range-bands", "rangeBandMultiplier") ||
      game.settings.get("lgs-token-range-bands", "sizeMultiplier");

    // Create the field for Range Band Multiplier.
    const rangeBandMultiplierDiv = $(`
      <hr>
      <b>Configure Narrative Drag Ruler</b><br>	  
      <div style="flex:none; font-size:10px"><i>Recommend grid type of <i>Gridless</i> for range bands and narrative drag ruler<br></div>
      <div class="form-group">
        <label>Range Band Multiplier</label>
        <input type="number" name="flags.lgs-token-range-bands.rangeBandMultiplier" value="${rangeBandMultiplier}" step="0.1" style="width:40px;">
      </div>
      <div style="flex:none; font-size:10px"><i>Adjust <i>Range Band Multiplier</i> to set size of range bands per scene.</i></div>
    `);

    gridTab.append(rangeBandMultiplierDiv);

    // Create and append the dropdown for Measurement Display Option.
    const measurementOption = app.object.getFlag("lgs-token-range-bands", "measurementOption") || "narrative";
    const measurementOptionDiv = $(`
      <div class="form-group">
        <label>Measurement Display Option</label>
        <select name="flags.lgs-token-range-bands.measurementOption">
          <option value="narrative" ${measurementOption === "narrative" ? "selected" : ""}>Narrative Drag Ruler Only</option>
          <option value="addToMeasurements" ${measurementOption === "addToMeasurements" ? "selected" : ""}>Add to Measurements</option>
          <option value="numeric" ${measurementOption === "numeric" ? "selected" : ""}>Only Numeric Measurements Only</option>
        </select>
      </div>
    `);

    gridTab.append(measurementOptionDiv);
  }
});

// =============== On Scene Creation: Set Default Range Band Multiplier Flag ===============
Hooks.on("createScene", async (scene, options, userId) => {
  // When a new scene is created, if no Range Band Multiplier flag is present,
  // set it to the value stored in the world setting "sizeMultiplier".
  const existing = scene.getFlag("lgs-token-range-bands", "rangeBandMultiplier");
  if (existing === undefined) {
    const defaultMultiplier = game.settings.get("lgs-token-range-bands", "sizeMultiplier");
    await scene.setFlag("lgs-token-range-bands", "rangeBandMultiplier", defaultMultiplier);
  }
});

// =============== Update Measured Templates When the Scene's Multiplier Changes ===============
Hooks.on("updateScene", async (scene, updateData, options, userId) => {
  // Only act if the active scene is updated and the multiplier flag is being changed
  if (canvas.scene && scene.id === canvas.scene.id && updateData.flags && updateData.flags["lgs-token-range-bands"] && updateData.flags["lgs-token-range-bands"].rangeBandMultiplier !== undefined) {
    const newMultiplier = updateData.flags["lgs-token-range-bands"].rangeBandMultiplier;
    // Find all measured templates that are part of our range bands (they have a baseDistance property stored in flags)
    const templates = canvas.scene.templates.filter(t => t.flags["lgs-token-range-bands"]?.baseDistance !== undefined);
    const updates = templates.map(t => {
      const baseDistance = t.flags["lgs-token-range-bands"].baseDistance;
      return {
        _id: t.id,
        distance: baseDistance * newMultiplier
      };
    });
    if (updates.length > 0) {
      await canvas.scene.updateEmbeddedDocuments("MeasuredTemplate", updates);
    }
  }
});

// =============== Token HUD Button for Range Bands ===============
Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
  const token = canvas.tokens.get(tokenData._id);
  if (!token) return;

  // Create a new HUD button.
  const btn = $(`
    <div class="control-icon" title="Toggle Range Bands">
      <i class="fas fa-circle"></i>
    </div>
  `);

  btn.click(async () => {
    // Look for any existing range-band templates for this token (global lookup by token id)
    const existing = canvas.scene.templates.filter(t =>
      t.flags["lgs-token-range-bands"]?.tokenId === token.id
    );

    if (existing.length > 0) {
      // If range bands are already active, only allow a GM to turn them off.
      if (game.user.isGM) {
        const ids = existing.map(t => t.id);
        await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", ids);
      } else {
        ui.notifications.warn("Only a GM can turn off range bands.");
      }
      return;
    }

    // Otherwise, create new global range-band templates.
    const multiplier = canvas.scene.getFlag("lgs-token-range-bands", "rangeBandMultiplier") ||
      game.settings.get("lgs-token-range-bands", "sizeMultiplier");

    // Determine token size (using hitArea dimensions or points)
    const sizeX = token.hitArea.width || (token.hitArea.points && token.hitArea.points[2]);
    const sizeY = token.hitArea.height || (token.hitArea.points && token.hitArea.points[4]);

    const x = token.document.x;
    const y = token.document.y;
    const centerX = x + sizeX / 2;
    const centerY = y + sizeY / 2;
    const color = "#0000FF";

    const config = game.settings.get("lgs-token-range-bands", "distanceConfig") || [];
    // Sort the base distances in ascending order.
    const sortedDistances = config.map(item => item.distance).sort((a, b) => a - b);
    // Compute the effective distances.
    const distances = sortedDistances.map(d => d * multiplier);
    const colors = ["#C75153", "#D3BE82", "#BBD8AB", "#63856B", "#7aa384", "#95c7a1", "#aae3b8", "#c8fad4", "9df5b2"];

    // Create templates from the outermost inwards.
    // Store the original (base) distance in the flags for later updating.
    for (let i = distances.length - 1; i >= 0; i--) {
      const templateData = {
        t: "circle",
        x: centerX,
        y: centerY,
        distance: distances[i],
        direction: 0,
        borderColor: color,
        fillColor: colors[i] || "#ffffff",
        flags: {
          "lgs-token-range-bands": {
            tokenId: token.id,
            rangeIndex: i,
            baseDistance: sortedDistances[i]
          }
        }
      };
      await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
    }
  });

  // Append the new button to the HUD’s right-side controls.
  html.find(".right").append(btn);
});

// =============== Remove Range Band Templates When a Token Moves ===============
Hooks.on("updateToken", async (tokenDocument, updateData, options, userId) => {
  // Only act if the token's position changes.
  const positionChanged = ("x" in updateData) || ("y" in updateData);
  if (!positionChanged) return;

  // Find all range-band templates tied to this token.
  const existingTemplates = canvas.scene.templates.filter(t =>
    t.flags["lgs-token-range-bands"]?.tokenId === tokenDocument.id
  );
  if (!existingTemplates.length) return;

  // Delete the templates.
  await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", existingTemplates.map(t => t.id));
});
