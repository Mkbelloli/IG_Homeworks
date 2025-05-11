// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);

    // Costruisci direttamente la matrice combinata Rotazione + Traslazione
    var trans = [
        cosY,         0, -sinY,        0,
        sinX * sinY,  cosX, sinX * cosY, 0,
        cosX * sinY, -sinX, cosX * cosY, 0,
        translationX, translationY, translationZ, 1
    ];
	
	var mvp = MatrixMult( projectionMatrix, trans );
	return mvp;
}

// Vertex shader source code
var myBoxVS = `
	attribute vec3 pos;
	uniform mat4 trans_matrix;
	uniform bool swapYZ;
	varying vec2 v_texcoord;
	attribute vec2 a_texcoord;
	void main()
	{
		if (swapYZ)
		{
			gl_Position = trans_matrix * vec4(pos.x, pos.z, pos.y, 1);
		}
		else 
		{
			gl_Position = trans_matrix * vec4(pos,1);
		}
		v_texcoord = a_texcoord;
	}
`;
// Fragment shader source code
var myBoxFS = `
	precision mediump float;
	varying vec2 v_texcoord;
	uniform sampler2D u_texture;
	uniform bool show_texture;
	void main() {
		if (show_texture)
		{
			gl_FragColor = texture2D(u_texture, v_texcoord);
		}
		else 
		{
			gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
		}
	}
`;


// [TO-DO] Complete the implementation of the following class.
class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		
		// Compile the shader program
		this.prog = InitShaderProgram( myBoxVS, myBoxFS );
		
		// Get the ids of the uniform variables in the shaders
		this.trans_matrix_id = gl.getUniformLocation( this.prog, 'trans_matrix' );
		this.swap_yz_id = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.VP_pos_id = gl.getAttribLocation( this.prog, 'pos' );
		this.u_texture_id = gl.getUniformLocation(this.prog, 'u_texture');
		this.show_texture_id = gl.getUniformLocation( this.prog, 'show_texture' );
				
		// Create buffers
		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.texCoord_id = gl.getAttribLocation(this.prog, "a_texcoord");
		this.textureBuffer = gl.createTexture();
		
		// Default values
		this.show_texture = true;
		this.loaded_texture = false;
		this.swap_yz = false;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numVertices  = vertPos.length / 3;
		
		// Create Vertex Position Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Create Texture Coordinate Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

	}

			
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		this.swap_yz = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		
		gl.useProgram( this.prog );
		
		// move data for shaders
		gl.uniformMatrix4fv( this.trans_matrix_id, false, trans );
		gl.uniform1i(this.swap_yz_id, this.swap_yz);
		gl.uniform1i(this.show_texture_id, this.show_texture && this.loaded_texture );
		
		// Bind Vertex Buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.vertexAttribPointer( this.VP_pos_id, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.VP_pos_id );

		if (this.loaded_texture) {
			// Bind Tex Coords Buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
			gl.vertexAttribPointer(this.texCoord_id, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(this.texCoord_id);
		}

		// Load Texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textureBuffer);
		gl.uniform1i(this.u_texture_id, 0);
			

        // Draw
		gl.drawArrays(gl.TRIANGLES, 0, this.numVertices  );
		
		// Disable Attr
		gl.disableVertexAttribArray( this.VP_pos_id );
		if (this.loaded_texture) {
			gl.disableVertexAttribArray(this.texCoord_id);
		}
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		
		// Load Image
		gl.bindTexture(gl.TEXTURE_2D, this.textureBuffer);
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		this.loaded_texture = true;
	}
		
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.show_texture = show
	}
	
}
