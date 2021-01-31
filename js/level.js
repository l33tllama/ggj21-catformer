const tile_types = {
    PLAYER_START: 1,
    BUILDING: 2,
    ROAD_STRAIGHT: 4,
    ROAD_STRAIGHT_ROT: 8,
    ROAD_INTERSECTION: 16,
    EXIT: 32
}

const level = [
    [02, 36, 02, 02, 02, 02, 02, 02],
    [02, 16, 08, 08, 08, 08, 16, 02],
    [02, 02, 02, 02, 02, 02, 04, 02],
    [02, 16, 08, 08, 08, 08, 16, 02],
    [02, 04, 02, 02, 02, 02, 02, 02],
    [02, 16, 08, 08, 08, 16, 02, 00],
    [02, 02, 02, 02, 02, 04, 02, 00],
    [00, 00, 00, 00, 02, 05, 02, 00],
];

/* obstacle types
1 - starting to mid (right)
2 - ccw intersection path (rot + right)
3 - cw intersection path (rot + right)
4 - basic level jump (right)
5 - basic level jump (left)
6 - crossing path R to L
7 - ccw intersection path (left)
8 - crossing path L to R
9 - cw intersection (right)
10 - ccw intersection (right)
*/

const level_obstacle_types = [
    [0, 4, 0, 0, 0, 0, 0, 0],
    [0, 3, 4, 4, 4, 4, 10,0],
    [0, 0, 0, 0, 0, 0, 4, 0],
    [0, 9, 5, 5, 5, 5, 2, 0],
    [0, 4, 0, 0, 0, 0, 0, 0],
    [0, 3, 4, 8, 5, 7, 0, 0],
    [0, 0, 0, 0, 0, 6, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
]

// X Win condition
// X background noise
// X fix buildings
// cat pain