Hooks.once("init", () => {
  console.log("lgs-token-range-bands | Initializing...");

  game.settings.register("lgs-token-range-bands", "sizeMultiplier", {
    name: "Size Multiplier",
    hint: "Increase or decrease to adjust range band size relative to map",
    scope: "client",
    config: true,
    default: 5,
    type: Number
  });
});

Hooks.on("renderTokenHUD", (hud, html, tokenData) => {
  const token = canvas.tokens.get(tokenData._id);
  if (!token) return;

  // Create a new HUD button
  const btn = $(`
    <div class="control-icon" title="Toggle Range Bands">
      <i class="fas fa-circle"></i>
    </div>
  `);

  // Toggle logic
  btn.click(async () => {
    const multiplier = game.settings.get("lgs-token-range-bands", "sizeMultiplier");
    const sizeX = token.hitArea.width;
    const sizeY = token.hitArea.height;
    const x = token.document.x;
    const y = token.document.y;
    const centerX = x + sizeX / 2;
    const centerY = y + sizeY / 2;
    const color = game.user.color;

    // Find existing templates with our custom flags
    const existing = canvas.scene.templates.filter(t =>
      t.flags["lgs-token-range-bands"]?.tokenId === token.id &&
      t.flags["lgs-token-range-bands"]?.userId === game.userId
    );

    if (existing.length > 0) {
      // Remove them
      const ids = existing.map(t => t.id);
      await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", ids);
      return;
    }

    // Otherwise create new ones
    const dist = [2, 5, 10, 20];
    const distances = dist.map(d => d * multiplier);
    const colors = ["#C75153","#D3BE82","#BBD8AB","#63856B"];

    for (let i = distances.length - 1; i >= 0; i--) {
      const templateData = {
        t: "circle",
        user: game.userId,
        x: centerX,
        y: centerY,
        distance: distances[i],
        direction: 0,
        borderColor: color,
        fillColor: colors[i],
        flags: {
          "lgs-token-range-bands": {
            tokenId: token.id,
            userId: game.userId
          }
        }
      };
      await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
    }
  });

  // Append the button to the right side
  html.find(".right").append(btn);
});

// Hook that recenters templates when a token finishes moving
Hooks.on("updateToken", async (tokenDocument, updateData, options, userId) => {
  const positionChanged = ("x" in updateData) || ("y" in updateData);
  if (!positionChanged) return;

  const token = canvas.tokens.get(tokenDocument.id);
  if (!token) return;

  // Find all range-band templates tied to this token
  const existingTemplates = canvas.scene.templates.filter(t =>
    t.flags["lgs-token-range-bands"]?.tokenId === tokenDocument.id
  );

  if (!existingTemplates.length) return;

  // Compute the token's new center
  const x = tokenDocument.x ?? token.document.x;
  const y = tokenDocument.y ?? token.document.y;
  const sizeX = token.hitArea.width;
  const sizeY = token.hitArea.height;
  const centerX = x + sizeX / 2;
  const centerY = y + sizeY / 2;

  // Prepare updates
  const updates = existingTemplates.map(t => {
    return {
      _id: t.id,
      x: centerX,
      y: centerY
    };
  });

  // Perform the update in one go
  await canvas.scene.updateEmbeddedDocuments("MeasuredTemplate", updates);
});
