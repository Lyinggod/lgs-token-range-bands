# Lyinggods Token Range Bands and Narrative Drag Ruler

This modules creates range bands and modifies the drag ruler to support abstracted range bands such as far, close, medium, etc instead of dealing with fiddly feet or meters.

## Token Range Bands

Creates range bands around the selected token using the token HUD. 

### Activating Range Bands

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/show%20range%20bands.gif" width=500>

**Update:** Moving the token automatically removes the range bands.

### Configuring Range Bands

Range Bands are configured in _Configure Settings_.

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/show%20config.png" width=400>

Range bands are defined in the _Distance Configuration_ dialog. 

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/show%20range%20config.png" width=400>

The names are used to define text shown for the narrative drag ruler (see below) and the _Relative Range Distance_ is the relative distance between between the bands. These distances are also used by the drag ruler.

_Drag Rule Approximation_ applies on to scenes with grid type _Square_. By default, Foundry appears to use Euclidean calculations when cacluating the drag ruler distance. This means that diagonal measurements are not the same straight line distance as straight up, down, left, or right measurements. This setting attempts to remove this desparity. The result is that diagonal measurements will not match to the number of square. The feature has limited use as diagnol measure meants are now straight line and now done by counting squares.

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/short%20range%20example.png" width=400>

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/short%20range%20diagonal%20example.png" width=400>

### Scene Configuration

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/scene%20configure%20example.png" width=400>

The _Range Band Multiplier_ is used to change the size of the range bands on a per scene basis depending on the scale of the map. It may need to be adjusted for each map.

### Narrative Drag Ruler

The drag ruler can show a narrative value such as "Short", "Close", "Not Far", "Really Far", etc instead of a numeric distance.

You can set the scene so that only narrative measurements are used, only numeric measurements are used, or both are used.

If the drag ruler exceeds the last range the the distance is marked as _Range Exceeded_. 

<img src="https://github.com/Lyinggod/lgs-token-range-bands/blob/main/images/drag%20bar%20example.gif" width=500>

## Credits
The range band code is baded on the code by _Leogar_ on the Foundry Vtt Discord Server.

The narrative range bands were inspired by module _Roger's Additional Metric Ruler Labels_ by Roger92.


