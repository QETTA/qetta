/**
 * Kakao Maps JavaScript SDK Type Definitions
 * @see https://apis.map.kakao.com/web/documentation/
 */

declare namespace kakao.maps {
  // ============================================
  // Core Classes
  // ============================================

  class LatLng {
    constructor(latitude: number, longitude: number)
    getLat(): number
    getLng(): number
    equals(latlng: LatLng): boolean
    toString(): string
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng)
    extend(latlng: LatLng): void
    getSouthWest(): LatLng
    getNorthEast(): LatLng
    isEmpty(): boolean
    toString(): string
  }

  class Point {
    constructor(x: number, y: number)
    equals(point: Point): boolean
    toString(): string
  }

  class Size {
    constructor(width: number, height: number)
    equals(size: Size): boolean
    toString(): string
  }

  // ============================================
  // Map
  // ============================================

  interface MapOptions {
    center: LatLng
    level?: number
    mapTypeId?: MapTypeId
    draggable?: boolean
    scrollwheel?: boolean
    disableDoubleClick?: boolean
    disableDoubleClickZoom?: boolean
    projectionId?: string
    tileAnimation?: boolean
    keyboardShortcuts?: boolean | KeyboardShortcutsOptions
  }

  interface KeyboardShortcutsOptions {
    speed?: number
  }

  type MapTypeId = 'ROADMAP' | 'SKYVIEW' | 'HYBRID'

  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    getCenter(): LatLng
    setLevel(level: number, options?: { anchor?: LatLng; animate?: boolean | { duration: number } }): void
    getLevel(): number
    setMapTypeId(mapTypeId: MapTypeId): void
    getMapTypeId(): MapTypeId
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void
    getBounds(): LatLngBounds
    setMinLevel(minLevel: number): void
    setMaxLevel(maxLevel: number): void
    panBy(dx: number, dy: number): void
    panTo(latlng: LatLng): void
    addControl(control: MapTypeControl | ZoomControl, position: ControlPosition): void
    removeControl(control: MapTypeControl | ZoomControl): void
    setDraggable(draggable: boolean): void
    getDraggable(): boolean
    setZoomable(zoomable: boolean): void
    getZoomable(): boolean
    relayout(): void
    addOverlayMapTypeId(mapTypeId: MapTypeId): void
    removeOverlayMapTypeId(mapTypeId: MapTypeId): void
    setKeyboardShortcuts(shortcuts: boolean): void
    getKeyboardShortcuts(): boolean
    setCopyrightPosition(position: CopyrightPosition, margin?: number): void
    getProjectionId(): string
    setProjectionId(projectionId: string): void
  }

  type ControlPosition =
    | typeof ControlPosition.TOP
    | typeof ControlPosition.TOPLEFT
    | typeof ControlPosition.TOPRIGHT
    | typeof ControlPosition.LEFT
    | typeof ControlPosition.RIGHT
    | typeof ControlPosition.BOTTOMLEFT
    | typeof ControlPosition.BOTTOM
    | typeof ControlPosition.BOTTOMRIGHT

  namespace ControlPosition {
    const TOP: number
    const TOPLEFT: number
    const TOPRIGHT: number
    const LEFT: number
    const RIGHT: number
    const BOTTOMLEFT: number
    const BOTTOM: number
    const BOTTOMRIGHT: number
  }

  type CopyrightPosition = 'BOTTOMLEFT' | 'BOTTOMRIGHT'

  // ============================================
  // Controls
  // ============================================

  class MapTypeControl {
    constructor()
  }

  class ZoomControl {
    constructor()
  }

  // ============================================
  // Marker
  // ============================================

  interface MarkerOptions {
    map?: Map
    position: LatLng
    image?: MarkerImage
    title?: string
    draggable?: boolean
    clickable?: boolean
    zIndex?: number
    opacity?: number
    altitude?: number
    range?: number
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setImage(image: MarkerImage): void
    getImage(): MarkerImage
    setPosition(position: LatLng): void
    getPosition(): LatLng
    setZIndex(zIndex: number): void
    getZIndex(): number
    setVisible(visible: boolean): void
    getVisible(): boolean
    setTitle(title: string): void
    getTitle(): string
    setDraggable(draggable: boolean): void
    getDraggable(): boolean
    setClickable(clickable: boolean): void
    getClickable(): boolean
    setAltitude(altitude: number): void
    getAltitude(): number
    setRange(range: number): void
    getRange(): number
    setOpacity(opacity: number): void
    getOpacity(): number
  }

  interface MarkerImageOptions {
    alt?: string
    coords?: string
    offset?: Point
    shape?: string
    spriteOrigin?: Point
    spriteSize?: Size
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions)
  }

  // ============================================
  // InfoWindow & CustomOverlay
  // ============================================

  interface InfoWindowOptions {
    content?: string | HTMLElement
    disableAutoPan?: boolean
    map?: Map
    position?: LatLng
    removable?: boolean
    zIndex?: number
    altitude?: number
    range?: number
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    open(map: Map, marker?: Marker): void
    close(): void
    getMap(): Map | null
    setPosition(position: LatLng): void
    getPosition(): LatLng
    setContent(content: string | HTMLElement): void
    getContent(): string | HTMLElement
    setZIndex(zIndex: number): void
    getZIndex(): number
    setAltitude(altitude: number): void
    getAltitude(): number
    setRange(range: number): void
    getRange(): number
  }

  interface CustomOverlayOptions {
    clickable?: boolean
    content?: string | HTMLElement
    map?: Map
    position?: LatLng
    xAnchor?: number
    yAnchor?: number
    zIndex?: number
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setPosition(position: LatLng): void
    getPosition(): LatLng
    setContent(content: string | HTMLElement): void
    getContent(): string | HTMLElement
    setVisible(visible: boolean): void
    getVisible(): boolean
    setZIndex(zIndex: number): void
    getZIndex(): number
    setAltitude(altitude: number): void
    getAltitude(): number
    setRange(range: number): void
    getRange(): number
  }

  // ============================================
  // Drawing
  // ============================================

  interface PolylineOptions {
    map?: Map
    path: LatLng[] | LatLng[][]
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: StrokeStyle
    zIndex?: number
  }

  type StrokeStyle = 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'shortdashdotdot' | 'dot' | 'dash' | 'dashdot' | 'longdash' | 'longdashdot' | 'longdashdotdot'

  class Polyline {
    constructor(options: PolylineOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setOptions(options: Partial<PolylineOptions>): void
    setPath(path: LatLng[] | LatLng[][]): void
    getPath(): LatLng[]
    getLength(): number
    setZIndex(zIndex: number): void
    getZIndex(): number
  }

  interface PolygonOptions {
    map?: Map
    path: LatLng[] | LatLng[][]
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: StrokeStyle
    fillColor?: string
    fillOpacity?: number
    zIndex?: number
  }

  class Polygon {
    constructor(options: PolygonOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setOptions(options: Partial<PolygonOptions>): void
    setPath(path: LatLng[] | LatLng[][]): void
    getPath(): LatLng[]
    getLength(): number
    getArea(): number
    setZIndex(zIndex: number): void
    getZIndex(): number
  }

  interface CircleOptions {
    map?: Map
    center: LatLng
    radius: number
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: StrokeStyle
    fillColor?: string
    fillOpacity?: number
    zIndex?: number
  }

  class Circle {
    constructor(options: CircleOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setOptions(options: Partial<CircleOptions>): void
    setPosition(position: LatLng): void
    getPosition(): LatLng
    setRadius(radius: number): void
    getRadius(): number
    getBounds(): LatLngBounds
    setZIndex(zIndex: number): void
    getZIndex(): number
  }

  interface RectangleOptions {
    map?: Map
    bounds: LatLngBounds
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: StrokeStyle
    fillColor?: string
    fillOpacity?: number
    zIndex?: number
  }

  class Rectangle {
    constructor(options: RectangleOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setOptions(options: Partial<RectangleOptions>): void
    setBounds(bounds: LatLngBounds): void
    getBounds(): LatLngBounds
    setZIndex(zIndex: number): void
    getZIndex(): number
  }

  // ============================================
  // Roadview
  // ============================================

  interface RoadviewOptions {
    panoId?: number
    panoX?: number
    panoY?: number
    pan?: number
    tilt?: number
    zoom?: number
  }

  class Roadview {
    constructor(container: HTMLElement, options?: RoadviewOptions)
    setPanoId(panoId: number, position: LatLng): void
    getPanoId(): number
    setViewpoint(viewpoint: Viewpoint): void
    getViewpoint(): Viewpoint
    getPosition(): LatLng
    relayout(): void
  }

  interface Viewpoint {
    pan: number
    tilt: number
    zoom: number
  }

  class RoadviewClient {
    constructor()
    getNearestPanoId(position: LatLng, radius: number, callback: (panoId: number) => void): void
  }

  class RoadviewOverlay {
    constructor()
    setMap(map: Map | null): void
    getMap(): Map | null
  }

  // ============================================
  // Events
  // ============================================

  namespace event {
    function addListener(target: Map | Marker | CustomOverlay | InfoWindow | Polyline | Polygon | Circle | Rectangle | Roadview, type: string, handler: (event?: MouseEvent) => void): void
    function removeListener(target: Map | Marker | CustomOverlay | InfoWindow | Polyline | Polygon | Circle | Rectangle | Roadview, type: string, handler: (event?: MouseEvent) => void): void
    function trigger(target: Map | Marker | CustomOverlay | InfoWindow | Polyline | Polygon | Circle | Rectangle | Roadview, type: string, data?: unknown): void
    function preventMap(): void
  }

  interface MouseEvent {
    latLng: LatLng
    point: Point
  }

  // ============================================
  // Services Library
  // ============================================

  namespace services {
    interface PlacesSearchOptions {
      location?: LatLng
      bounds?: LatLngBounds
      radius?: number
      rect?: string
      size?: number
      page?: number
      sort?: SortBy
      category_group_code?: string
      useMapBounds?: boolean
      useMapCenter?: boolean
    }

    type SortBy = 'accuracy' | 'distance'

    interface PlacesSearchResult {
      address_name: string
      category_group_code: string
      category_group_name: string
      category_name: string
      distance: string
      id: string
      phone: string
      place_name: string
      place_url: string
      road_address_name: string
      x: string
      y: string
    }

    type PlacesSearchStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

    interface Pagination {
      totalCount: number
      hasNextPage: boolean
      hasPrevPage: boolean
      current: number
      first: number
      last: number
      perPage: number
      nextPage: () => void
      prevPage: () => void
      gotoPage: (page: number) => void
      gotoFirst: () => void
      gotoLast: () => void
    }

    class Places {
      constructor(map?: Map)
      setMap(map: Map): void
      keywordSearch(keyword: string, callback: (result: PlacesSearchResult[], status: PlacesSearchStatus, pagination: Pagination) => void, options?: PlacesSearchOptions): void
      categorySearch(code: string, callback: (result: PlacesSearchResult[], status: PlacesSearchStatus, pagination: Pagination) => void, options?: PlacesSearchOptions): void
    }

    interface AddressSearchOptions {
      page?: number
      size?: number
    }

    interface AddressSearchResult {
      address_name: string
      address_type: string
      x: string
      y: string
      address: Address
      road_address: RoadAddress | null
    }

    interface Address {
      address_name: string
      region_1depth_name: string
      region_2depth_name: string
      region_3depth_name: string
      region_3depth_h_name: string
      h_code: string
      b_code: string
      mountain_yn: string
      main_address_no: string
      sub_address_no: string
      x: string
      y: string
    }

    interface RoadAddress {
      address_name: string
      region_1depth_name: string
      region_2depth_name: string
      region_3depth_name: string
      road_name: string
      underground_yn: string
      main_building_no: string
      sub_building_no: string
      building_name: string
      zone_no: string
      x: string
      y: string
    }

    type AddressSearchStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

    class Geocoder {
      constructor()
      addressSearch(address: string, callback: (result: AddressSearchResult[], status: AddressSearchStatus) => void, options?: AddressSearchOptions): void
      coord2Address(lng: number, lat: number, callback: (result: Coord2AddressResult[], status: AddressSearchStatus) => void, options?: { input_coord?: string }): void
      coord2RegionCode(lng: number, lat: number, callback: (result: Coord2RegionResult[], status: AddressSearchStatus) => void, options?: { input_coord?: string }): void
      transCoord(lng: number, lat: number, callback: (result: TransCoordResult[], status: AddressSearchStatus) => void, options?: { input_coord?: string; output_coord?: string }): void
    }

    interface Coord2AddressResult {
      address: Address | null
      road_address: RoadAddress | null
    }

    interface Coord2RegionResult {
      region_type: string
      address_name: string
      region_1depth_name: string
      region_2depth_name: string
      region_3depth_name: string
      region_4depth_name: string
      code: string
      x: number
      y: number
    }

    interface TransCoordResult {
      x: number
      y: number
    }

    type Status = 'OK' | 'ZERO_RESULT' | 'ERROR'

    // Status constants
    namespace Status {
      const OK: 'OK'
      const ZERO_RESULT: 'ZERO_RESULT'
      const ERROR: 'ERROR'
    }

    // SortBy constants
    namespace SortBy {
      const ACCURACY: 'accuracy'
      const DISTANCE: 'distance'
    }
  }

  // ============================================
  // Clusterer Library
  // ============================================

  interface MarkerClustererOptions {
    map?: Map
    markers?: Marker[]
    gridSize?: number
    averageCenter?: boolean
    minLevel?: number
    minClusterSize?: number
    styles?: ClusterStyle[]
    texts?: string[] | ((size: number) => string)
    calculator?: number[] | ((size: number) => number)
    disableClickZoom?: boolean
  }

  interface ClusterStyle {
    width?: string
    height?: string
    background?: string
    borderRadius?: string
    color?: string
    textAlign?: string
    fontWeight?: string
    lineHeight?: string
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions)
    addMarker(marker: Marker, nodraw?: boolean): void
    removeMarker(marker: Marker, nodraw?: boolean): void
    addMarkers(markers: Marker[], nodraw?: boolean): void
    removeMarkers(markers: Marker[], nodraw?: boolean): void
    clear(): void
    redraw(): void
    getGridSize(): number
    setGridSize(size: number): void
    getMinClusterSize(): number
    setMinClusterSize(size: number): void
    getAverageCenter(): boolean
    setAverageCenter(bool: boolean): void
    getMinLevel(): number
    setMinLevel(level: number): void
    getTexts(): string[] | ((size: number) => string)
    setTexts(texts: string[] | ((size: number) => string)): void
    getCalculator(): number[] | ((size: number) => number)
    setCalculator(calculator: number[] | ((size: number) => number)): void
    getStyles(): ClusterStyle[]
    setStyles(styles: ClusterStyle[]): void
  }

  // ============================================
  // Static Methods
  // ============================================

  function load(callback: () => void): void
}

declare global {
  interface Window {
    kakao: typeof kakao
  }
}
