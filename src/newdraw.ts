import {Circle, Connector, ControllerPoint, CurvedConnector} from "./draw";
import * as $ from 'jquery';

const xmlns = 'http://www.w3.org/2000/svg';

const SVG_ID = 'svg_canvas'; //ID of the created svg canvas


/** ===========
 *  Variables
 =========== */

/** ===========
 *    CIRCLES
 =========== */
const CIRCLE_COLOR = 'transparent';
const CIRCLE_COLOR_SELECTED = 'rgba(0,255,0,0.5)';
const CIRCLE_SIZE = 15;

const CIRCLE_STROKE_COLOR = 'black';
const CIRCLE_STROKE_WIDTH = '3';

/** ============
 *   CONNECTOR
 ============ */

const CONNECTOR_COLOR = 'black';//'#5d4037'
const CONNECTOR_WIDTH = 4;

/** =============
 *  CURVED CONNECTOR CONTROLLER
 ============== */

const CONTROLLER_COLOR = 'red';
const CONTROLLER_SIZE = 5;




export class SVG {


    // ============
    // Design
    // ============
    public gridVisible = true;
    public gridSize = 20;

    // ============
    // HTMLElements
    // ============
    public field: HTMLElement; //field to embedd this into
    public svgDOM: Element; //svg element

    //Groups for child elements
    public controllerGroup: Element; //render first
    public linesGroup: Element; //render second
    public pointsGroup: Element; //render third


    public scale =  {x: 0, y: 0, width: 1000, height: 1000}; //for scaling

    //===============
    // incrementing ids
    //===============
    public points_id = 0;
    public lines_id = 0;

    public selected_elements: Array<SVGElement> = [];


    //TODO
    //key inputs
    public multi_select: boolean = false;

    /**
     * Create a new SVG-Element
     * @param id parent container
     */
    constructor(id: string) {

        this.field =  document.getElementById(id); //search field
        //TODO if not found

        //Create SVG element
        this.svgDOM = document.createElementNS(xmlns, 'svg');

        //set Attributes for svg-element
        this.svgDOM.setAttributeNS(null, 'width', '100%');
        this.svgDOM.setAttributeNS(null, 'height', '100%');
        this.svgDOM.setAttributeNS( null, 'id', SVG_ID); //TODO
        this.field.appendChild(this.svgDOM);

        // Set Grid as background if option selected
        if (this.gridVisible) {
            const svg = document.getElementById('svg_canvas'); //get Element
            svg.style.backgroundImage = 'url(http://svgjs.com/svg.draw.js/demo/grid.png)';
            svg.style.backgroundSize = '20px 20px'
        }

        //create Groups
        this.linesGroup = document.createElementNS(xmlns, 'g');
        this.linesGroup.setAttributeNS(null, 'id', 'svg_lines');

        this.pointsGroup = document.createElementNS(xmlns, 'g');
        this.pointsGroup.setAttributeNS(null, 'id', 'svg_points');

        this.controllerGroup = document.createElementNS(xmlns, 'g');
        this.controllerGroup.setAttributeNS(null, 'id', 'svg_controllers');

        this.svgDOM.appendChild(this.controllerGroup);
        this.svgDOM.appendChild(this.linesGroup);
        this.svgDOM.appendChild(this.pointsGroup);

        //set scale
        this.scale.width =  $('#svg_canvas').width();
        this.scale.height = $('#svg_canvas').height();
        this.svgDOM.setAttributeNS(null, 'viewBox', this.scale.x + ' ' + this.scale.y + ' ' + this.scale.width + ' ' + this.scale.height);
    }

    /**
     * get Cursor inside of the canvas scale
     * @param evt
     */
    getMouseInCanvas(evt) {
        const pt = {x: 0, y: 0};
        pt.x = evt.clientX - $('#svg_canvas').offset().left; //offset so svg is selected
        pt.y = evt.clientY - $('#svg_canvas').offset().top;

        //get width of element
        const svg_width = $('#svg_canvas').width();
        const svg_height = $('#svg_canvas').height();

        const factor_x =    this.scale.width / svg_width ;
        const factor_y =   this.scale.height / svg_height;

        pt.x *= factor_x;
        pt.y *= factor_y;

        //left / right
        pt.x += this.scale.x;
        pt.y += this.scale.y;

        return pt;
    }

    //TODO
    public scaleSVG(factor: number, x: number, y: number) {
    }

    /**
     * Add a Point to the canvas
     * @param c
     */
    public addPoint(point: Point) {
        //TODO
        this.points_id++;
    }

    public addLine(line: Line) {
        //TODO
        this.lines_id++;
    }

    public getSvgDOM(): Element {
        return this.svgDOM;
    }

    public select(element: SVGElement){
        //if shift is pressed
        if(this.multi_select){
            this.selected_elements.push(element);
        } else {
            this.selected_elements = [element];
        }
    }

}


export class SVGElement {

    protected parent: SVG; //SVG Element

    public x: number;  //x position
    public y: number;  //y position
    public r: number;  //radius of element, for elements without radius this will be 0
    protected fill: string = 'none'; //fill color of element

    protected id: string; //id for group Element

    protected groupElement: Element; //group Element
    protected domElement: Element; //DOM Element

    constructor(parent: SVG, id: string, x: number, y: number, r: number, fill: string) {
        this.parent = parent;
        this. id = id;
        this.x = x;
        this.y = y;
        this.r = r ;
        this.fill = fill;

        this.domElement.addEventListener('click', this.onClick);
    }

    public onClick(event){
        this.select();
    }

    public select(){
        this.parent.select(this);
    }

    public update(){
        console.log("Please override this function!");
    }


}

export class Point extends SVGElement{

    constructor(parent: SVG, id: string, x: number, y: number, r: number, fill: string) {
        super(parent, id, x, y, r, fill);
        this.createDOM();

    }


    public createDOM(){


        this.groupElement = document.createElementNS(xmlns, 'g');
        this.groupElement.setAttributeNS (null, 'transform', 'matrix(1,0,0,-1,'+this.x+','+this.y+')');
        this.groupElement.setAttributeNS(null,'id', this.id);

        this.domElement = document.createElementNS(xmlns, 'circle');
        this.domElement.setAttribute('r', this.r.toString());
        this.domElement.setAttribute('x', '0');
        this.domElement.setAttribute('y', '0');
        this.domElement.setAttribute('id',this.id+"_element");
        this.domElement.setAttribute('fill', this.fill);

        this.groupElement.appendChild(this.domElement);

        const cross_x = document.createElementNS(xmlns, 'rect');
        cross_x.setAttribute('x', '-10');
        cross_x.setAttribute('y', this.r.toString());

        cross_x.setAttribute('width', (this.r * 2 + 20).toString());
        cross_x.setAttribute('height', '1');

        cross_x.setAttribute('fill', 'none');
        cross_x.setAttribute('stroke', CIRCLE_STROKE_COLOR);
        cross_x.setAttribute('stroke-width', '1');

        this.groupElement.appendChild(cross_x);

        const cross_y = document.createElementNS(xmlns, 'rect');
        cross_y.setAttribute('x', this.r.toString());
        cross_y.setAttribute('y', '-10');

        cross_y.setAttribute('width', '1');
        cross_y.setAttribute('height', (this.r * 2 + 20).toString());

        cross_y.setAttribute('fill', 'none');
        cross_y.setAttribute('stroke', CIRCLE_STROKE_COLOR);
        cross_y.setAttribute('stroke-width', '1');

        this.groupElement.appendChild(cross_y);


        this.parent.pointsGroup.appendChild(this.groupElement);
    }

    public select(){
        this.parent.select(this);
        //TODO design, color changes
    }

    public connect(other: Point){
        const id = ""; //TODO
        new Line(this.parent, id, this,other, 'none'); //TODO ??
    }


}

export class Line extends SVGElement{

    public p1: Point;
    public p2: Point;

    public path: string;

    constructor(parent: SVG, id: string,p1: Point, p2:Point, fill: string) {
        const midpoint = calculateMidPoint(p1.x,p1.y,p2.x,p2.y)
        super(parent, id, midpoint.x, midpoint.y, 0, fill);
        this.p1 = p1;
        this.p2 = p2;
        this.createDOM();
    }

    public createDOM(){

        this.groupElement = document.createElementNS(xmlns, 'g');
        this.groupElement.setAttributeNS (null, 'transform', 'matrix(1,0,0,-1,'+this.x+','+this.y+')');
        this.groupElement.setAttributeNS(null,'id', this.id);

        this.path = this.createPath();
        this.domElement = document.createElementNS(xmlns, 'path');

        this.domElement.setAttribute('id', this.id);
        this.domElement.setAttribute('d', this.path);
        this.domElement.setAttribute('stroke', CONNECTOR_COLOR);
        this.domElement.setAttribute('stroke-width', CONNECTOR_WIDTH.toString());
        this.domElement.setAttribute('fill', this.fill);


        this.groupElement.appendChild(this.domElement);
        this.parent.linesGroup.appendChild(this.groupElement);
    }

    public createPath(): string {
        return 'M' + (this.p1.x + this.p1.r) + ' ' + (this.p1.y - this.p1.r) + 'L' + (this.p2.x + this.p2.r) + ' ' + (this.p2.y - this.p2.r);
    }



}

//TODO
function calculateMidPoint(x1: number,y1: number,x2:number,y2: number) {
    return {x: (x1 + (x1 + x2) / 2), y: (y1 + (y1 + y2) / 2)};
}
