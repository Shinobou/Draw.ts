# Draw.ts
Framework for creating technical drawings with SVG 
The Goal of the Framework is to provide functionalities for the user to draw lines himself.
Every line is connected by 2 Endpoints, which also connect different lines together.

Also the frameworks provide functionallities to make these lines dragable.

With the step to TypeScript were trying to better support TS-Frameworks like Angular, but also keep support for js.
For an not ts project just comile the ts file.

version: 0.1-b

## ChangeLog:
Previous version: 0.0
* initialised project

## Planned Features:
Create Plugins
* Printable: Print Mode (hide points)
* Forms: Different Forms like
* Fill: Colorfill for drawn forms
* ConnectedLines: ConnectLines so they will equally be dragged


# Installing


# Quickstart
HTML:
`<div id="drawing></div>`


TS:
`const svg = new SVG('drawing');
new Circle(svg,100,100,15);`


# First Steps

To use the Draw.ts framework you need an `<div id="my-id">` as wrapper for the svg-canvas. 

(You can pick any id you want)

Then create in js/ts an SVG object:

`const svg = new SVG("my-id");`

This will automatically create an `<svg>` tag inside your wrapper with 100% width and height and an grid design as background. This grid design can be disables (Disable Grid).

# Elements

Every Element is Selectable and Deleteable

# SVG Modes
0. NONE => No Mode selected
1. ADD => Add new Circles on click at the svg-element
2. 
3. CONNECT => Connect two circles by clicking them after each other

# SnapToGird
With the snapToGrid Mode, every created or moved circle will end on the Grid.
This can be setted with `setSnapToGrid(boolean)` or `toggleSnapToGrid()`.

Another way is to press `ctrl`. While it's pressed SnapToGrid Mode is active.

# Create Circles
 A cricle is a moveable nodes.

`new Circle(svg,x,y,r);`

svg = Your SVG element to create the circle in
x = x coordinate of position
y = y coordinate of position
r = radius (size) of cirlce

Every Circle is Dragable

# Create Connections

Connections can be created automtically:
When the user selects two circles while it's in `Connect` SVG-Mode.

# Curves


