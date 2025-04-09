// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
	
	for (let y = 0; y < fgImg.height ; y++) {
		for (let x = 0; x < fgImg.width ; x++) {
			
			const fg_index = (y * fgImg.width + x) * 4;
			
		    let fg_r = fgImg.data[fg_index];
			let fg_g = fgImg.data[fg_index + 1];
			let fg_b = fgImg.data[fg_index + 2];
			let fg_a = fgOpac * fgImg.data[fg_index + 3]/255;

			if (((y+fgPos.y) > bgImg.height) || ((x+fgPos.x) > bgImg.width)	)
				continue;
			if (((y+fgPos.y) < 0) || ((x+fgPos.x) < 0)	)
				continue;
			
			const bg_index = ((y+fgPos.y) * bgImg.width + (x+fgPos.x)) * 4;
		
				 
				let bg_r = bgImg.data[bg_index];
				let bg_g = bgImg.data[bg_index + 1];
				let bg_b = bgImg.data[bg_index + 2];
				let bg_a = bgImg.data[bg_index + 3]/255;
			
				a = fg_a + (1 - fg_a) * bg_a;
				bgImg.data[bg_index] = (fg_a * fg_r + (1 - fg_a) * bg_a * bg_r) / a;
				bgImg.data[bg_index + 1] = (fg_a * fg_g + (1 - fg_a) * bg_a * bg_g) / a;
				bgImg.data[bg_index + 2] = (fg_a * fg_b + (1 - fg_a) * bg_a * bg_b) / a;
		

		}
	}

}
