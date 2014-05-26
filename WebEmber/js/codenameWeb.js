

/* ---------- Circle Progess Bars ---------- */

function circle_progess() {
	var divElement = $('div'); //log all div elements

	if (retina()) {
		$(".whiteCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 240,
	        'height': 240,
			'bgColor': 'rgba(255,255,255,0.5)',
	        'fgColor': 'rgba(255,255,255,0.9)',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	    });
	
		$(".circleStat").css('zoom',0.5);
		$(".whiteCircle").css('zoom',0.999);
	} else {
		
		$(".whiteCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
			'bgColor': 'rgba(255,255,255,0.5)',
	        'fgColor': 'rgba(255,255,255,0.9)',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	    });
		
	}
	
	
	
	$(".circleStatsItemBox").each(function(){
		
		var value = $(this).find(".value > .number").html();
		var unit = $(this).find(".value > .unit").html();
		var percent = $(this).find("input").val()/100;
		
		countSpeed = 2300*percent;
		
		endValue = value*percent;
		
		$(this).find(".count > .unit").html(unit);
		$(this).find(".count > .number").countTo({
			
			from: 0,
		    to: endValue,
		    speed: countSpeed,
		    refreshInterval: 50,
		    onComplete: function(value) {
		    	console.debug(this);
		    }
		
		});
		
		//$(this).find(".count").html(value*percent + unit);
		
	});
	
	var yellowValue = $(".yellowCircle").val();
	var blueValue = $(".blueCircle").val();
	var redValue = $(".orangeCircle").val();
	var max = Math.max(yellowValue, blueValue, redValue);

	$(".greenCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#78CD51',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })

    $(".orangeCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#FA5833',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })

	$(".lightOrangeCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#f4a70c',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })

    $(".blueCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#2FABE9',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })

	$(".yellowCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#e7e572',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })

	$(".pinkCircle").knob({
        'min':0,
        'max':max,
        'readOnly': true,
        'width': 120,
        'height': 120,
        'fgColor': '#e42b75',
        'dynamicDraw': false,
        'thickness': 0.2,
        'tickColorizeValues': true,
		'skin':'tron'
    })
	
	
}         


/* ---------- Check Retina ---------- */

function retina(){
	retinaMode = (window.devicePixelRatio > 1);
	
	return retinaMode;
	
}       



/* ---------- Page width functions ---------- */

$(window).bind("resize", widthFunctions);
$(document).ready(function() {
	widthFunctions();
})

function widthFunctions(e) {
    var winHeight = $(window).height();
    var winWidth = $(window).width();

	var contentHeight = $("#content").height();

	if (winHeight) {
		console.log(winHeight);
		$("#content").css("min-height",winHeight*0.8655);
		
	}
	
	if (contentHeight) {
		
		//$("#sidebar-left2").css("height", contentHeight);
		
	}
    
	if (winWidth < 980 && winWidth > 767) {
		
		if($(".main-menu-span").hasClass("span2")) {
			
			$(".main-menu-span").removeClass("span2");
			$(".main-menu-span").addClass("span1");
			
		}
		
		if($("#content").hasClass("span10")) {
			
			$("#content").removeClass("span10");
			$("#content").addClass("span11");
			
		}
		
		
		$("a").each(function(){
			
			if($(this).hasClass("quick-button-small span1")) {

				$(this).removeClass("quick-button-small span1");
				$(this).addClass("quick-button span2 changed");
			
			}
			
		});
		
		$(".circleStatsItem, .circleStatsItemBox").each(function() {
			
			var getOnTablet = $(this).parent().attr('onTablet');
			var getOnDesktop = $(this).parent().attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).parent().removeClass(getOnDesktop);
				$(this).parent().addClass(getOnTablet);
			
			}
			  			
		});
		
		$(".tempStatBox").each(function() {
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnDesktop);
				$(this).addClass(getOnTablet);
			
			}
			  			
		});
		
		$(".box").each(function(){
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnDesktop);
				$(this).addClass(getOnTablet);
			
			}
			  			
		});
		
		$(".widget").each(function(){
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnDesktop);
				$(this).addClass(getOnTablet);
			
			}
			  			
		});
							
	} else {
		
		if($(".main-menu-span").hasClass("span1")) {
			
			$(".main-menu-span").removeClass("span1");
			$(".main-menu-span").addClass("span2");
			
		}
		
		if($("#content").hasClass("span11")) {
			
			$("#content").removeClass("span11");
			$("#content").addClass("span11");
			
		}
		
		$("a").each(function(){
			
			if($(this).hasClass("quick-button span2 changed")) {

				$(this).removeClass("quick-button span2 changed");
				$(this).addClass("quick-button-small span1");
			
			}
			
		});
		
		$(".circleStatsItem, .circleStatsItemBox").each(function() {
			
			var getOnTablet = $(this).parent().attr('onTablet');
			var getOnDesktop = $(this).parent().attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).parent().removeClass(getOnTablet);
				$(this).parent().addClass(getOnDesktop);
			
			}
			  			
		});
		
		$(".tempStatBox").each(function() {
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnTablet);
				$(this).addClass(getOnDesktop);
			
			}
			  			
		});
		
		$(".box").each(function(){
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnTablet);
				$(this).addClass(getOnDesktop);
			
			}
			  			
		});
		
		$(".widget").each(function(){
			
			var getOnTablet = $(this).attr('onTablet');
			var getOnDesktop = $(this).attr('onDesktop');
			
			if (getOnTablet) {
			
				$(this).removeClass(getOnTablet);
				$(this).addClass(getOnDesktop);
			
			}
			  			
		});
		
	}
	
	if($('.timeline')) {
		
		$('.timeslot').each(function(){
			
			var timeslotHeight = $(this).find('.task').outerHeight();
			
			$(this).css('height',timeslotHeight);
			
		});
		
	}

}
