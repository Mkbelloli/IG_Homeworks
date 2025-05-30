// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// grad to rad
	angle =  rotation * Math.PI / 180
	
	// scale + rotation + translation in 3x3 column-major
	return Array(   scale * Math.cos(angle),   	scale * Math.sin(angle), 	0, 
	                - scale* Math.sin(angle), 	scale * Math.cos(angle), 	0, 
					positionX, 					positionY, 					1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	// trans2*trans1
	// output[i][j] = Σ trans2[i][k] * trans1[k][j] => output[i+j*3] = Σ trans2[i+k*3] * trans1[k+j*3]
	return Array( trans2[0]*trans1[0] + trans2[3]*trans1[1] + trans2[6]*trans1[2],
					trans2[1]*trans1[0] + trans2[4]*trans1[1] + trans2[7]*trans1[2],
					trans2[2]*trans1[0] + trans2[5]*trans1[1] + trans2[8]*trans1[2],

					trans2[0]*trans1[3] + trans2[3]*trans1[4] + trans2[6]*trans1[5],
					trans2[1]*trans1[3] + trans2[4]*trans1[4] + trans2[7]*trans1[5],
					trans2[2]*trans1[3] + trans2[5]*trans1[4] + trans2[8]*trans1[5],

					trans2[0]*trans1[6] + trans2[3]*trans1[7] + trans2[6]*trans1[8],
					trans2[1]*trans1[6] + trans2[4]*trans1[7] + trans2[7]*trans1[8],
					trans2[2]*trans1[6] + trans2[5]*trans1[7] + trans2[8]*trans1[8]
				  );
}
