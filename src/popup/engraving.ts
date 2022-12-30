export interface Engrave {
    head: Array<Engraving>
    col: Array<Col>
    decrease: Array<Engraving>,
    name: string
}

export interface Engraving {
    id: number,
    name: string,
    value: number
}

export interface Col {
    id: number,
    name: string,
    cell: Array<Cell>
}
export interface Cell {
    id: number,
    value: number
}