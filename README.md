# Lyinggods Token Range Bands and Narrative Drag Ruler

## Token Range Bands

Creates range bands around the selected token using the token HUD. 

### Activating Range Bands

![activate range bands](https://github.com/user-attachments/assets/359f8b4d-332b-4340-b104-49395c49702c)


### Configuring Range Bands

Range Bands are configured in _Configure Settings_.

<img src="https://github.com/user-attachments/assets/50bab889-9628-4aa6-986e-c8daf4e93d01" width=400 />

Range bands are defined in the _Distance Configuration_ dialog. 

<img src="https://github.com/user-attachments/assets/1266c48a-74fc-4bb6-adc0-54021bd5d1ae" width=400>

The names are used to define text shown for the narrative drag ruler (see below) and the _Relative Range Distance_ is the relative distance between between the bands. These distances are also used by the drag ruler.

_Drag Rule Approximation_ applies on to scenes with grid type _Square_. By default, Foundry appears to use Euclidean calculations when cacluating the drag ruler distance. This means that diagonal measurements are not the same straight line distance as straight up, down, left, or right measurements. This setting attempts to remove this desparity. The result is that diagonal measurements will not match to the number of square. The feature has limited use as diagnol measure meants are now straight line and now done by counting squares.

<img src="https://github.com/user-attachments/assets/bd21f4c0-0fe3-44cf-bd8d-e75792d8d7c9" width=200>

<p>
    <img src="https://github.com/user-attachments/assets/40a6f037-7bc7-4255-8cd2-a34035a2b130" width="300" /> 
    <br>
    <i>Drag Rule Approximation</i> disabled. Notice that in both pictures, 3 square are counted but in the lower image, <i>Short Range</i> is well outside the circle for the same number of feet measured.
</p>

### Scene Configuration


<p>
    <img src="https://github.com/user-attachments/assets/5b2fcf25-4375-4af3-9572-be8d48560a65" width="400" />
</p>

The _Range Band Multiplier_ is used to change the size of the range bands on a per scene basis depending on the scale of the map. It may need to be adjusted for each map.

### Narrative Drag Ruler

The drag ruler can show a narrative value such as "Short", "Close", "Not Far", "Really Far", etc instead of a numeric distance.

You can set the scene so that only narrative measurements are used, only numeric measurements are used, or both are used.

If the drag ruler exceeds the last range the the distance is marked as _Range Exceeded_. 

![Untitled video - Made with Clipchamp](https://github.com/user-attachments/assets/a4054a1a-ec61-4cc5-86d9-7d5a29de9254)


## Credits
The range band code is baded on the code by _Leogar_ on the Foundry Vtt Discord Server.

The narrative range bands were inspired by module _Roger's Additional Metric Ruler Labels_ by Roger92.

