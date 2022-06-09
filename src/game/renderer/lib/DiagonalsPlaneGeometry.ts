import { BufferGeometry, Float32BufferAttribute } from 'three';


type Diagonals = 'left' | 'right' | 'both' | 'random'

class DiagonalsPlaneGeometry extends BufferGeometry {
	
	private parameters: { width: number; height: number; widthSegments: number; heightSegments: number; diagonals: Diagonals  };

	constructor( width = 1, height = 1, widthSegments = 1, heightSegments = 1, diagonals:Diagonals = 'random' ) {

		super();
		this.type = 'PlaneGeometry';

		this.parameters = {
			width: width,
			height: height,
			widthSegments: widthSegments,
			heightSegments: heightSegments,
			diagonals: diagonals
		};

		const width_half = width / 2;
		const height_half = height / 2;

		const gridX = Math.floor( widthSegments );
		const gridY = Math.floor( heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = width / gridX;
		const segment_height = height / gridY;

		//

		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		for ( let iy = 0; iy < gridY1; iy ++ ) {

			const y = iy * segment_height - height_half;

			for ( let ix = 0; ix < gridX1; ix ++ ) {

				const x = ix * segment_width - width_half;

				vertices.push( x, - y, 0 );

				normals.push( 0, 0, 1 );

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );

			}

		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;


				if( this.parameters.diagonals === 'left') {
				indices.push( a, c, d );
				indices.push( b, c, a );
				} else if( this.parameters.diagonals === 'right') {
					indices.push( a, b, d );
					indices.push( b, c, d );
				} else if( this.parameters.diagonals === 'both') {
					indices.push( a, b, c );
					indices.push( a, b, d );
				
					indices.push( a, c, d );
					indices.push( b, c, d );
				} else {
					if(Math.random() > 0.5){
						indices.push( a, b, d );
						indices.push( b, c, d );
					} else {
						indices.push( a, c, d );
						indices.push( b, c, a );
					}
				}
				
			}

		}

		this.setIndex( indices );
		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	}

	static fromJSON( data:any ) {

		return new DiagonalsPlaneGeometry( data.width, data.height, data.widthSegments, data.heightSegments );

	}

}

export { DiagonalsPlaneGeometry, DiagonalsPlaneGeometry as PlaneBufferGeometry };
