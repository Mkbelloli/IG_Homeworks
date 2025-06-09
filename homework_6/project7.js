// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
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
	
	var mv = trans;
	return mv;
}

// Vertex shader source code
var myBoxVS = `
	attribute vec3 pos;
	attribute vec2 a_texcoord;
	attribute vec3 normal;

	uniform mat4 matrix_mvp;
	uniform mat4 matrix_mv;
	uniform mat4 matrix_norm;
	uniform bool swapYZ;

	varying vec2 v_texcoord;
	varying vec3 v_normal;
	varying vec3 v_pos;

void main() {

	if (swapYZ)
		gl_Position = matrix_mvp * vec4(pos.x, pos.z, pos.y, 1.0);
	else 
		gl_Position = matrix_mvp * vec4(pos, 1.0);

	v_texcoord = a_texcoord;
	v_pos = gl_Position.xyz;
	
	v_normal = normal.xyz;	
}

`;
// Fragment shader source code
var myBoxFS = `
	precision mediump float;

	varying vec2 v_texcoord;
	varying vec3 v_normal;
	varying vec3 v_pos;

	uniform sampler2D u_texture;
	uniform bool show_texture;

	uniform vec3 light_direction;      	// light direction
	uniform float shininess;    		// shininess

void main() {
	
	// Default values
	vec3 white_color = vec3(1.0);

	// Basic normalized vector
	vec3 N = normalize(v_normal);
	vec3 L = normalize(light_direction);
	vec3 V = normalize(-v_pos); // verso la camera
	vec3 H = normalize(L + V);  // half-vector per Blinn-Phong

	// cos coefficients 
	float NdotL = max(dot(N, L), 0.0);
	float NdotH = max(dot(N, H), 0.0);

    // Kd and Ks coefficients
	vec4 baseColor = show_texture ? texture2D(u_texture, v_texcoord) : vec4(white_color,1);
    vec3 Kd = baseColor.rgb; 
    vec3 Ks = white_color;      

    // Calculate components
    vec3 diffuse = NdotL * Kd;     // Diffusa
    vec3 specular = pow(NdotH, shininess) * Ks;     // Speculare

    // All together...
    gl_FragColor = vec4(diffuse + specular, baseColor.a);
}
`;

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.prog = InitShaderProgram( myBoxVS, myBoxFS );
		
		// Get the ids of the uniform variables in the shaders
		this.matrix_mvp_id = gl.getUniformLocation( this.prog, 'matrix_mvp' );
		this.matrix_mv_id = gl.getUniformLocation( this.prog, 'matrix_mv' );
		this.matrix_norm_id = gl.getUniformLocation( this.prog, 'matrix_norm' );
		this.swap_yz_id = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.shininess_id = gl.getUniformLocation( this.prog, 'shininess' );
		this.light_direction_id = gl.getUniformLocation( this.prog, 'light_direction' );
		this.VP_pos_id = gl.getAttribLocation( this.prog, 'pos' );
		this.VP_normal_id = gl.getAttribLocation( this.prog, 'normal' );
		this.u_texture_id = gl.getUniformLocation(this.prog, 'u_texture');
		this.show_texture_id = gl.getUniformLocation( this.prog, 'show_texture' );
		this.texCoord_id = gl.getAttribLocation(this.prog, "a_texcoord");

		// Create buffers
		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.normalsBuffer = gl.createBuffer();
		this.textureBuffer = gl.createTexture();
		
		// Default values
		this.shininess = 0;
		this.light_direction = [1,1,1];
		this.swap_yz = false;
		this.show_texture = true;
		this.loaded_texture = false;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		
		// Create Vertex Position Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Create Texture Coordinate Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// Create Texture Coordinate Buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.useProgram( this.prog );
		
		// move data for shaders
		gl.uniformMatrix4fv( this.matrix_mvp_id, false, matrixMVP );
		gl.uniformMatrix4fv( this.matrix_mv_id, false, matrixMV );
		gl.uniformMatrix4fv( this.matrix_norm_id, false, matrixNormal );
		gl.uniform3fv( this.light_direction_id, this.light_direction);
		gl.uniform1i(this.swap_yz_id, this.swap_yz);
		gl.uniform1f(this.shininess_id, this.shininess);
		
		// Bind Vertex Buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexBuffer );
		gl.vertexAttribPointer( this.VP_pos_id, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.VP_pos_id );

		// Bind Normal Buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalsBuffer );
		gl.vertexAttribPointer( this.VP_normal_id, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.VP_normal_id );

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
		gl.uniform1i(this.show_texture_id, this.show_texture && this.loaded_texture );

        // Draw it
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles  );
		
		// Disable attrib
		gl.disableVertexAttribArray( this.VP_pos_id );
		gl.disableVertexAttribArray( this.VP_normal_id );
		if (this.loaded_texture) {
			gl.disableVertexAttribArray(this.texCoord_id);
		}
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
// [TO-DO] Bind the texture
		
		// Load image
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		this.light_direction =  [x, y, z];
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		this.shininess = shininess
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// [TO-DO] Compute the total force of each particle
	
	// [TO-DO] Update positions and velocities
	
	// [TO-DO] Handle collisions
	
}

