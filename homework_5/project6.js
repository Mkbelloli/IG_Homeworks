var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

// Introduced to handle approximation
float EPSILON_INTERSECT = 1e-4;  // for intersection	
float SHADOW_BIAS = 1e-2;  // bias for surface intersection

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		
		// TO-DO: Check for shadows
		
		Ray shadow_ray;  // shadow_ray calculus
		shadow_ray.dir = normalize(lights[i].position - position);
		vec3 shadow_ray_position = position + shadow_ray.dir * SHADOW_BIAS;
		shadow_ray.pos = shadow_ray_position;
		
		float max_dist = length(lights[i].position - shadow_ray_position);
		HitInfo h;
		
		if ( IntersectRay(h, shadow_ray) && (h.t < max_dist) ) {
			// TO-DO: there is a shadow
			continue;
		} else {
		
			// TO-DO: If not shadowed, perform shading using the Blinn model
			
			// Diffuse term
			float NdotL = max(dot(normal, shadow_ray.dir), 0.0);
			vec3 diffuse = mtl.k_d * lights[i].intensity * NdotL;

			// Specular term
			float NdotH = max(dot(normal, normalize(shadow_ray.dir + view)), 0.0);
			vec3 specular = pow(NdotH, mtl.n) * mtl.k_s * lights[i].intensity;

			color = color + diffuse + specular;
			//color += mtl.k_d * lights[i].intensity;	// change this line
		}
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		
		// TO-DO: Test for ray-sphere intersection
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, ray.pos - spheres[i].center);
		float c = dot(ray.pos - spheres[i].center, ray.pos - spheres[i].center) - (spheres[i].radius * spheres[i].radius);
		float d = (b * b) - (4.0 * a * c);
		
		if ( d < 0.0 ) { continue;} // discr < 0 so no intersection
		
		float t = ( -b - sqrt(d) ) / ( 2.0 * a ); 
		
		if ( t < hit.t && t >= EPSILON_INTERSECT){
			// TO-DO: If intersection is found, update the given HitInfo
			hit.t = t;
			hit.mtl = spheres[i].mtl;
			hit.position = ray.pos + t * ray.dir;
			hit.normal = normalize(hit.position - spheres[i].center);
			foundHit = true;
		}
		
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			r.dir = ray.dir - 2.0 * dot(ray.dir, hit.normal) * hit.normal; // ray.dir is toward the reflection point
			r.pos = hit.position;
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				vec3 clr_n = Shade( h.mtl, h.position, h.normal, view );
				
				// TO-DO: Update the loop variables for tracing the next reflection ray
				ray = r;
				view = normalize(ray.dir); 
				k_s *= h.mtl.k_s;
				hit = h;
				clr += (k_s * clr_n);
								
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;