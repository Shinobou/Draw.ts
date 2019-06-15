/**
 * Created by: Michael Fritz
 * version: 0.2b-20190613
 * TODO:
 *    Multi Drag (bug)
 *    Zoom (bug)
 *    Addons:
 *    ?Layer (feature)
 *    Forms (feature)
 *    PrintMode (feature)
 *    MirrorMode (feature)
 */
import * as $ from 'jquery';
import {insertView} from '@angular/core/src/render3/node_manipulation';
import {el} from '@angular/platform-browser/testing/src/browser_util';

// Namespace for svg elements
const xmlns = 'http://www.w3.org/2000/svg';

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



/**
 * SVG Element
 * Adds SVG HTMLElement to an Container
 */
export class SVG {

  // ============
  // Design
  // ============
  public gridVisible = true;

  public gridSize = 20;

  // ============
  // HTMLElements
  // field = Parent Element
  // svg   = New SVG- Element
  // ============
  public field: HTMLElement;
  public svg: Element;

  //Groups for child elements
  public controllerGroup: Element; //render first
  public connectorGroup: Element; //render second
  public circleGroup: Element; //render third


  public scale =  {x: 0, y: 0, width: 1000, height: 1000}; //1016 * 839.279

  //List for child Data
  public circles: Array<Circle> = [];

  // ==============
  // curved  = All Connectors where CurvedConnectors
  // snap_to_grid = New Circles, dragged circles snaps to Grid
  // ==============
  public curved = false;
  private snap_to_grid = false;

  //SVG Modes (for clicks)
  public mode_add = false;
  public mode_connect =  false;


  // =================
  // For selection and dragging
  // =================
  public select_multi = false;
  public selected_element: Array<SVGElement> = [];
  public drag_element: SVGElement;

  //id for circles
  public circles_id = 0;

  public circle_effects: Array<string> = []; //TODO more

  /**
   * Create a mew SVG-Element
   * @param id parent container
   */
  constructor(id: string) {
    this.field =  document.getElementById(id);
    this.svg = document.createElementNS(xmlns, 'svg'); //create Element

    //set Attributes for svg-element
    this.svg.setAttributeNS(null, 'width', '100%');
    this.svg.setAttributeNS(null, 'height', '100%');
    this.svg.setAttributeNS( null, 'id', 'svg_canvas'); //TODO

    this.field.appendChild(this.svg);

    // Set Grid as background if option selected
    if (this.gridVisible) {
     // this.svg.setAttributeNS( null, 'style', 'background: url(http://svgjs.com/svg.draw.js/demo/grid.png) #fff;');
      const svg = document.getElementById('svg_canvas');
      svg.style.backgroundImage = 'url(http://svgjs.com/svg.draw.js/demo/grid.png)';
      svg.style.backgroundSize = '20px 20px';
      //TODO cast to HTMLElement
      //this.svg.style.backgroundImage = 'url(http://svgjs.com/svg.draw.js/demo/grid.png)';
      //this.svg.style.backgroundSize = '20px 20px';
    }

    //create Group for connectors and add to svg
    this.connectorGroup = document.createElementNS(xmlns, 'g');
    this.connectorGroup.setAttributeNS(null, 'id', 'svg_connectors');

    this.circleGroup = document.createElementNS(xmlns, 'g');
    this.circleGroup.setAttributeNS(null, 'id', 'svg_circles');

    this.controllerGroup = document.createElementNS(xmlns, 'g');
    this.controllerGroup.setAttributeNS(null, 'id', 'svg_controllers');

    this.svg.appendChild(this.controllerGroup);
    this.svg.appendChild(this.connectorGroup);
    this.svg.appendChild(this.circleGroup);

    /*  ===================
    *       Drag and Drop
        =================== */
    this.svg.addEventListener('mousemove', (event) => {
      /*
      if an drag element is set
       */
      if (this.drag_element) {
        /*
        calculate mouse position in container
         */
        const cursor = this.cursorPoint(event);

        if (this.drag_element instanceof ControllerPoint) {
          ///only drag this point

          //when snapMode is active
          if (this.isSnapMode()) {
            cursor.x = Math.round(cursor.x / this.gridSize) * this.gridSize - this.drag_element.r;
            cursor.y = Math.round(cursor.y  / this.gridSize) * this.gridSize + this.drag_element.r;
            cursor.x += this.drag_element.r; //TODO hebt sich auf?
            cursor.y -= this.drag_element.r;

            this.drag_element.drag(cursor.x, cursor.y );
          } else {
          }
            this.drag_element.drag(cursor.x, cursor.y);



        } else { //multi drag mode!!

          for (const element of this.selected_element) { //selected elements
            let dist_x = 0;
            let dist_y = 0;

            if (element !== this.drag_element) {  //TODO for connectors
              dist_x = (element.x - this.drag_element.x);
              dist_y = ( element.y - this.drag_element.y);
            }

            //when snapMode is active
            if (this.isSnapMode()) {
              cursor.x = Math.round(cursor.x / this.gridSize) * this.gridSize - element.r;

              cursor.y = Math.round(cursor.y  / this.gridSize) * this.gridSize + element.r;

              cursor.x += element.r;
              cursor.y -= element.r;

              element.drag(cursor.x + dist_x, cursor.y + dist_y);
            } else {

              element.drag(cursor.x + dist_x, cursor.y + dist_y);

              //debug draw point!!

              if (dist_x !== 0) {
                const group = document.createElementNS(xmlns, 'g');
                group.setAttributeNS(null, 'transform', 'matrix(1,0,0,-1,' + (cursor.x + dist_x) + ',' + (cursor.y + dist_y) + ')');

                // create circle element for display
                const point = document.createElementNS(xmlns, 'circle');
                point.setAttribute('r', '5');
                point.setAttribute('x', '0');
                point.setAttribute('y', '0');

                group.appendChild(point);
                this.svg.appendChild(group);
              }

            }
          }
        }
      }


    });

    //end drag -> mouseup
    this.svg.addEventListener('mouseup', (event) => {
      if (this.drag_element) {
          this.drag_element.dragged = false;
          this.drag_element = undefined;
      }
    });

    /**
     * KeyListener for Canvas
     */
    document.addEventListener('keydown', (event) => {
      if (event.keyCode === 17) {//if CTRL is pressed
        this.setSnapToGrid(true); //active GridMode
      }

      if (event.keyCode === 46) { //if Delete/Entf pressed
        for (const element of this.selected_element) {
          console.log(element);
          element.remove(); //remove selected element
        }
        this.selected_element = []; //unselect al
      }

      if (event.keyCode === 16) {//if SHIFT is pressed
        this.select_multi = true; //multi select mode
      }


    });

    /**
     * =====================
     * Scrolling
     * ======================
     */
     this.svg.addEventListener('wheel', event => {
       const scroll = event.deltaY * -1; //100 vs -100
       const dir = 1 - (event.deltaY / 500); //TODO + direction!
       const cursor = this.cursorPoint(event);
       this.scaleSVG(dir, event.clientX, event.clientY);
     });




    /**
     * KeyListener
     * for release
     *
     */
    document.addEventListener('keyup', (event) => { //TODO not working
      if (event.keyCode === 17) {//CTRL
        this.setSnapToGrid(false); //disable GridMode
      }

      if (event.keyCode === 16) {//if SHIFT
        this.select_multi = false; //release multi select mode
      }
    });

    /**
     * MouseDown in Canvas
     */
    this.svg.addEventListener('mousedown', (event) => {
      /*
      calculate MousePosition
       */
      const cursor = this.cursorPoint(event);
      //add Circle
      if (this.mode_add) {
        // add Circle
        const c = new Circle(this, cursor.x, cursor.y, CIRCLE_SIZE);
        this.addCircle(c);

        if (this.mode_connect) {
          if (this.selected_element.length === 1) {
            const selected = this.selected_element[0];
            if (selected instanceof Circle) {
              let con;
              if (this.curved) {
                con = new CurvedConnector(this, c, selected);
              } else {
                con = new Connector(this, c, selected);
              }
            }
            //drag_start


          }
        }
        this.select(c);
      }
    });

    //add geneated SVG-Element to wrapper
   // this.field.appendChild(this.svg);

    //set scale
    this.scale.width =  $('#svg_canvas').width();
    this.scale.height = $('#svg_canvas').height();
    this.svg.setAttributeNS(null, 'viewBox', this.scale.x + ' ' + this.scale.y + ' ' + this.scale.width + ' ' + this.scale.height);
  }

  /**
   * get Cursor inside of the canvas scale
   * @param evt
   */
   cursorPoint(evt) {
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


  public scaleSVG(factor: number, x: number, y: number) {

    const svg_width = $('#svg_canvas').width();
    const svg_height = $('#svg_canvas').height();

    const per_x = x / svg_width; //precent of position
    const per_y = y / svg_height; //precent of position

    this.scale.x = this.scale.x +  (this.scale.width - (this.scale.width * factor)) * per_x; //*0.5 for middle
    this.scale.y = this.scale.y + (this.scale.height - (this.scale.height * factor)) * per_y;

    //this.scale.x = (this.scale.width * factor) / 2 + (this.scale.width - (this.scale.width * factor)) * per_x ;
    //this.scale.y = (this.scale.height * factor) / 2 + (this.scale.height - (this.scale.height * factor)) * per_y ;


    this.scale.width *= factor;
    this.scale.height *= factor;

    this.svg.setAttributeNS(null, 'viewBox', this.scale.x + ' ' + this.scale.y + ' ' + this.scale.width + ' ' + this.scale.height);

    //TODO scale Grid

    const scale_x = $('#svg_canvas').width() / this.scale.width   * 20;
    const scale_y = $('#svg_canvas').height() / this.scale.height   * 20;
    this.gridSize = scale_x;

    $('#svg_canvas').style.backgroundSize = scale_x + 'px ' + scale_y + 'px';
    //position of grid??
  //TODO x,y versschieben
    //console.log('left ' + (this.scale.x % this.gridSize) +'px top'+ (this.scale.y % 20)+'px');
    //this.svg.style.backgroundPosition = 'left ' + (this.scale.x % this.gridSize) +'px top '+ (this.scale.y % this.gridSize)+'px';
    //this.svg.style.backgroundPositionY = this.scale.y % 20;

  }

  /**
   * Add a Circle to the canvas
   * @param c
   */
  public addCircle(c: Circle) {
    this.circles.push(c); //add to list
    c.setId(this.circles_id); //set CircleID
    c.addHoverEffect(this.circle_effects); //add Effects
    this.circleGroup.appendChild(c.getGroup()); //add to Group
    this.circles_id++;
  }

  public removeCircle(c: Circle) {
    this.circles = this.circles.filter(obj => obj !== c); //remove from list
    //this.svg.removeChild(c.getGroup());
    this.circleGroup.removeChild(c.getGroup());
  }

  public addConnection(connector: Connector) {
    this.connectorGroup.appendChild(connector.getElement());
    connector.c1.connect(connector);
    connector.c2.connect(connector);
  }

  public removeConnection(connector: Connector) {
    this.connectorGroup.removeChild(connector.getElement());
  }

  public removePoint(c: ControllerPoint) {
    this.svg.removeChild(c.getGroup());
  }

  select(element: SVGElement) {
    // set color of old selected element to default
    if (!this.select_multi && this.selected_element.length !== 0) {
      for (const selected of this.selected_element) {
        selected.setColor('default');
        // hide controller point if CurvedConnector was selected
        if (selected instanceof CurvedConnector) {
          selected.controllerPoint.getElement().setAttribute('fill', 'none');
        }
      }
    }

    //select new Element
    if (this.select_multi) {
      this.selected_element.push(element);
    } else {
      this.selected_element = [element];
    }
    element.setColor('selected');

    if (element instanceof CurvedConnector) { //show ControllerPoint if CurvedConnector is selected
      element.controllerPoint.getElement().setAttribute('fill', CONTROLLER_COLOR);
    }
  }

  setDrag(dragable: SVGElement, event: Event) {
      this.drag_element = dragable;


      //for all curved selectables set drag_start TODO?????????????????????????????
    const cursor = this.cursorPoint(event);

    for (const element of this.selected_element) { //selected elements
      console.log(element);
      if (element instanceof Connector) {
        let dist_x = 0;
        let dist_y = 0;

        if (element !== this.drag_element) {  //TODO for connectors
          dist_x = (element.x - this.drag_element.x);
          dist_y = ( element.y - this.drag_element.y);

        }
        //when snapMode is active
        if (this.isSnapMode()) {
          cursor.x = Math.round(cursor.x / this.gridSize) * this.gridSize - element.r;

          cursor.y = Math.round(cursor.y  / this.gridSize) * this.gridSize + element.r;

          cursor.x += element.r;
          cursor.y -= element.r;

          element.drag_start.x = cursor.x + dist_x;
          element.drag_start.y = cursor.y + dist_y;
          console.log(element.drag_start);
      } else {
          element.drag_start.x = cursor.x + dist_x;
          element.drag_start.y = cursor.y + dist_y;
          console.log(element.drag_start);
        }
      }
    }

  }




  public toggleSnap() {
    this.snap_to_grid = !this.snap_to_grid;
  }

  public  toggleCurved() {
    this.curved = !this.curved;
  }

  public isCurved(): boolean {
    return this.curved;
  }

  public setSnapToGrid(snap: boolean) {
    this.snap_to_grid = snap;
  }

  public isSnapMode(): boolean {
    return this.snap_to_grid;
  }

  public getSVG(): Element {
    return this.svg;
  }

}

/**
 * abstract Class for Elements inside the <svg> tag
 */
export class SVGElement {

  protected parent: SVG;

  // html element of the SVGElement
  protected element: Element;

  protected hoverEffects: Array<string> = [];

  // if element is being dragged
  public dragged = false;

  public x: number;
  public y: number;
  public r: number;

  // set parent on init
  constructor(parent: SVG) {
    this.parent = parent;
  }

  //MUST be called at the end of child constructors!! TODO
  //inits standart EventListener for HoverEffects
  afterCreate() {
    this.element.addEventListener('mouseenter', (event) => {
      //apply effects
      for (const effect of this.hoverEffects) {
        const old_style = this.element.getAttributeNS(null, 'style');
        this.element.setAttributeNS(null, 'style', old_style + '; ' + effect); //TODO
      }

    });
    //remove effects
    this.element.addEventListener('mouseleave', (event) => {
      for (const effect of this.hoverEffects) {
        this.element.removeAttributeNS(null, 'style');
      }
    });
  }

  public setColor(color: string) {
    this.element.setAttribute('fill', color);
  }

  public remove() {
    //TODO
  }

  public drag(x: number, y: number) {
    //TODO
  }

  public getElement(): Element {
    return this.element;
  }

  public addHoverEffect(string) {
    this.hoverEffects.push(string);
  }

}

export class Circle extends SVGElement implements IDragable {

  public x: number;
  public y: number;
  public r: number;
  public fill: string; //color
  public style: string; //css

  private id: number;

  public group: Element; //TODO private
  //private element: Element;

  public parent: SVG;

  public connections: Array<Connector> = [];

  constructor(svg: SVG, x: number, y: number, r: number) {
    super(svg);

    this.x = x;
    this.y = y;
    this.r = r;

    this.group = document.createElementNS(xmlns, 'g');

    if (this.parent.isSnapMode()) {

      //mouse

      this.x = Math.round(x / this.parent.gridSize) * this.parent.gridSize - this.r;
      this.y = Math.round(y  / this.parent.gridSize) * this.parent.gridSize + this.r;
      this.group.setAttributeNS (null, 'transform', 'matrix(1,0,0,-1,'+this.x+','+this.y+')');
    } else {
      this.x = this.x - CIRCLE_SIZE;
      this.y = this.y + CIRCLE_SIZE;
      this.group.setAttributeNS (null, 'transform', 'matrix(1,0,0,-1,'+this.x+','+this.y+')');
    }



    this.element = document.createElementNS(xmlns, 'circle');
    this.element.setAttribute('r', this.r.toString());
    this.element.setAttribute('cx', this.r.toString());
    this.element.setAttribute('cy', this.r.toString());

    this.element.setAttribute('fill', 'transparent');

    this.element.setAttribute('stroke', CIRCLE_STROKE_COLOR);
    this.element.setAttribute('stroke-width', CIRCLE_STROKE_WIDTH);

    this.parent.addCircle(this);


    //=========================
    // CROSS
    // =======================

    const cross_x = document.createElementNS(xmlns, 'rect');
    cross_x.setAttribute('x', '-10');
    cross_x.setAttribute('y', this.r.toString());

    cross_x.setAttribute('width', '50');
    cross_x.setAttribute('height', '1');

    cross_x.setAttribute('fill', 'none');
    cross_x.setAttribute('stroke', CIRCLE_STROKE_COLOR);
    cross_x.setAttribute('stroke-width', '1');

    this.group.appendChild(cross_x);

    const cross_y = document.createElementNS(xmlns, 'rect');
    cross_y.setAttribute('x', this.r.toString());
    cross_y.setAttribute('y', '-10');

    cross_y.setAttribute('width', '1');
    cross_y.setAttribute('height', '50');

    cross_y.setAttribute('fill', 'none');
    cross_y.setAttribute('stroke', CIRCLE_STROKE_COLOR);
    cross_y.setAttribute('stroke-width', '1');

    this.group.appendChild(cross_y);



    //drag events
    this.group.addEventListener('mousedown', (event) => {

      let connected = false;

      //for connection
      if (this.parent.mode_connect) {
        if (this.parent.selected_element.length === 1 && this.parent.selected_element[0] instanceof Circle) {
          const selected_circle = <Circle>this.parent.selected_element[0];
          let exist = false;
          for (const con of this.connections) {
            if (con.c1 === this.parent.selected_element[0] || con.c2 === this.parent.selected_element[0]) {
              exist = true;
            }
          }
          if (!exist) {

            let con;
            if (this.parent.curved) {
              con = new CurvedConnector(this.parent, selected_circle, this); //new connector
            } else {
              con = new Connector(this.parent, selected_circle, this); //new connector
            }
          }
          connected = true;
        }
      }

      if (!connected) {
        this.dragged = true;
        this.parent.select(this);
        this.parent.setDrag(this, event);
      } else {
        this.dragged = false;
        this.parent.select(this); //TODO ?? undefindd
        this.parent.setDrag(undefined, event);

      }


    });



    this.group.appendChild(this.element);

    this.afterCreate();
  }


  public connect(con: Connector) {
    this.connections.push(con);
  }


  public setColor(color: string) {

    if (color === 'default') {
      color = CIRCLE_COLOR;
    } else if (color === 'selected') {
      color = CIRCLE_COLOR_SELECTED;
    }
    this.element.setAttribute('fill', color);
  }


  getGroup(): Element {
    return this.group;
  }

  setId(id: number) {
    this.id = id;
    this.element.setAttribute('id', 'Svg_circle_' + this.id);
  }

  getId(): number {
    return this.id;
  }

  update() {

    this.group.setAttributeNS(null, 'transform', 'matrix(1,0,0,-1,' + this.x + ',' + this.y + ')');

    for (const con of this.connections) {
      con.update();
    }
  }


  remove() {
    this.parent.removeCircle(this);
    //remove connectrions
    for (const con of this.connections) {
      con.c1.removeConnection(con);
      con.c2.removeConnection(con);
      this.parent.removeConnection(con);
    }
  }

  removeConnection(con) {
    this.connections = this.connections.filter(obj => obj !== con); //remove from list
  }

  setX(x: number) {
    this.x = x;
  }

  setY(y: number) {
    this.y = y;
  }


  drag(x: number, y: number) {
    this.x = x - this.r;
    this.y = y + this.r;
    this.update();
  }

}

export class Connector extends SVGElement implements IDragable {

  public c1: Circle;
  public c2: Circle;


  //middel of the connector
  public x;
  public y;

  // private element: Element;
  public parent: SVG;

  protected path: string;

  public drag_start;

  constructor(parent: SVG, c1: Circle, c2: Circle) {
    super(parent);
    this.c1 = c1;
    this.c2 = c2;

    this.r = 0;

    this.path = this.createPath();
    this.element = document.createElementNS(xmlns, 'path');

    this.element.setAttribute('id', 'path_' + c1.getId() + '_' + c2.getId());
    this.element.setAttribute('d', this.path);
    this.element.setAttribute('stroke', CONNECTOR_COLOR);
    this.element.setAttribute('stroke-width', CONNECTOR_WIDTH.toString());
    this.element.setAttribute('fill', 'none');


    this.parent.addConnection(this);

    this.drag_start = {x: 0 , y: 0};

    //drag events
    this.element.addEventListener('mousedown', (event) => {
      const mouse_x = event.pageX - $('#svg_canvas').offset().left;
      const mouse_y = event.pageY - $('#svg_canvas').offset().top;

      this.drag_start = {x: mouse_x , y: mouse_y};
      this.parent.select(this);
      this.parent.setDrag(this, event);


    });

    this.setMid();
    this.afterCreate();
  }

  public createPath(): string {
    return 'M' + (this.c1.x + this.c1.r) + ' ' + (this.c1.y - this.c1.r) + 'L' + (this.c2.x + this.c2.r) + ' ' + (this.c2.y - this.c2.r);
  }

  public getElement(): Element {
    return this.element;
  }

  update() {
    this.path = this.createPath();
    this.element.setAttribute('d', this.path);

    //TODO update x,y
    this.setMid();
  }

  public setMid() {

    const c1_x = this.c1.x + this.c1.r;
    const c1_y = this.c1.y - this.c1.r;

    const c2_x = this.c2.x + this.c2.r;
    const c2_y = this.c2.y - this.c2.r;

    if (c1_x < c2_x) {
      this.x = c1_x + ((c2_x - c1_x) / 2); //radia offset
    } else {
      this.x = c2_x + (c1_x - c2_x) / 2;
    }

    if (c1_y < c2_y) {
      this.y = c1_y + (c2_y - c1_y) / 2;
    } else {
      this.y = c2_y + (c1_y - c2_y) / 2;
    }
  }

  public setColor(color: string) {
    if (color === 'default') {
      color = CONNECTOR_COLOR;
    } else if (color === 'selected') {
      color = CIRCLE_COLOR_SELECTED;
    }
    this.element.setAttribute('stroke', color);
  }

  remove() {
    this.parent.removeConnection(this);
    this.c1.removeConnection(this);
    this.c2.removeConnection(this);

    this.parent.selected_element =  this.parent.selected_element.filter(obj => obj !== this);
  }

  setX(x: number) {
    this.x = x;
  }

  setY(y: number) {
    this.y = y;
  }

  drag(x: number, y: number) {

    //move poinrs
    this.c1.x += x - this.drag_start.x;
    this.c1.y += y - this.drag_start.y;

    this.c2.x += x - this.drag_start.x;
    this.c2.y += y - this.drag_start.y;

    this.drag_start = {x: x, y: y};

    this.c1.update();
    this.c2.update();
    this.setMid();
  }

  dragByCircles(c1_x: number, c1_y: number, c2_x: number, c2_y: number) {
    this.c1.drag(c1_x, c1_y);
    this.c2.drag(c2_x, c2_y)
    this.setMid();
  }

}

export class CurvedConnector extends Connector {

  public controllerPoint: ControllerPoint;

  constructor(parent: SVG, c1: Circle, c2: Circle) {
    super(parent, c1, c2);
    this.controllerPoint = new ControllerPoint(this.parent, this,  this.c2.x - ((this.c2.x - this.c1.x) / 2),  this.c2.y - ((this.c2.y - this.c1.y) / 2));
    this.parent.controllerGroup.appendChild(this.controllerPoint.getGroup());
    this.setMid();
  }


  public createPath(): string {

    /**
     * Because createPath is called in super Const, before controllerPoint is set!
     */
    if (!this.controllerPoint) {
      this.controllerPoint = new ControllerPoint(this.parent, this,  this.c2.x - ((this.c2.x - this.c1.x) / 2),  this.c2.y - ((this.c2.y - this.c1.y) / 2));
    }

    const dist_direction = {x: this.c2.x - this.c1.x, y: this.c2.y - this.c1.y };


    const middel_str = (this.controllerPoint.x  - this.c1.x ) + ' ' + (this.controllerPoint.y  - this.c1.y); //get relatic pos to c1
    return 'M' + (this.c1.x + this.c1.r) + ' ' + (this.c1.y - this.c1.r) + ' q'  + middel_str + ',' + (dist_direction.x) + ' ' + (dist_direction.y);
  }

  update() {
    this.path = this.createPath();
    this.element.setAttribute('d', this.path);
    //this.controllerPoint.updateDown();
  }

  remove() {
    this.parent.removeConnection(this);
    this.c1.removeConnection(this);
    this.c2.removeConnection(this);
    this.controllerPoint.remove();

    this.parent.selected_element =  this.parent.selected_element.filter(obj => obj !== this);
  }

  drag(x: number, y: number) {

    //move poinrs
    this.c1.x += x - this.drag_start.x;
    this.c1.y += y - this.drag_start.y;

    this.c2.x += x - this.drag_start.x;
    this.c2.y += y - this.drag_start.y;

    this.controllerPoint.x +=  x - this.drag_start.x;
    this.controllerPoint.y += y - this.drag_start.y;

    this.drag_start = {x: x, y: y};

    this.c1.update();
    this.c2.update();
    this.controllerPoint.update();
  }

}


export class ControllerPoint extends SVGElement implements IDragable {

  public x: number;
  public y: number;
  public r: number;

  public group: Element;
  // curve this controller belongs to
  private curve: CurvedConnector;

  constructor(parent: SVG, curve: CurvedConnector, x: number, y: number) {
    super(parent);
    this.x = x;
    this.y = y;
    this.curve = curve;
    this.r = CONTROLLER_SIZE;

    // create transformed group for position
    this.group = document.createElementNS(xmlns, 'g');
    this.group.setAttributeNS(null, 'transform', 'matrix(1,0,0,-1,' + ( x) + ',' + ( y) + ')');

    // create circle element for display
    this.element = document.createElementNS(xmlns, 'circle');
    this.element.setAttribute('r', this.r.toString());
    this.element.setAttribute('x', '0');
    this.element.setAttribute('y', '0');

    this.element.setAttribute('fill', 'none'); //standart: hidden element

    this.group.appendChild(this.element);

    //drag events
    this.group.addEventListener('mousedown', (event) => {
      this.dragged = true;
      this.parent.setDrag(this, event);
    });

    this.group.addEventListener('mouseup', (event) => {
      this.dragged = false;
      this.parent.setDrag(undefined, event);
    });

    this.afterCreate();
  }

  getGroup(): Element {
    return this.group;
  }

  update() {
    this.group.setAttributeNS(null, 'transform', 'matrix(1,0,0,-1,' + ( this.x) + ',' + (this.y) + ')');
    // update parent (curve)
    this.curve.update();
  }

  setX(x: number) {
    this.x =  x + this.r;
  }

  setY(y: number) {
    this.y = y - this.r;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.update();
  }

  remove() {
    this.parent.removePoint(this);
  }

}

/**
 * Interface for dragable elements
 */
export interface IDragable {
  dragged: boolean;
  x: number;
  y: number;
  r: number;

  update();
  drag(x: number, y: number);
  setX(x: number);
  setY(y: number);
}
