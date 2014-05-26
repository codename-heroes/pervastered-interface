//========================================================================
//
//   App definition
//
//========================================================================
google.load("visualization", "1");

var tardis,
	googleLoaded = false;

App = Ember.Application.create({
	LOG_TRANSITIONS: false,
	ready: function() {

	},
	loadDetailedView: function(id, class_type) {
		if (class_type == undefined) {
			class_type = tardis.getClassType(id);
		}

		if (class_type) {
			var element = class_type.find(id);

			tardis.hideOpenLabels();

			App.Router.router.transitionTo(element.get("type")+'.index', element);
		}
	},
	loadTardis: function() {
		if (tardis == undefined && !googleLoaded) {
			googleLoaded = true;
			tardis = new links.Tardis();
		}
	},
	loadLocation : function(object) {
        var object = $(object);
        if (object.data("geo-located")) return;
		
        object.data("geo-located", "0");
        var latitude = parseFloat(object.data("latitude")).toFixed(3),
			longitude = parseFloat(object.data("longitude")).toFixed(3),
			request = $.ajax({
	            url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+ latitude +","+ longitude +"&sensor=false",
	            type: "get"
	        });

        request.done(function (response, textStatus, jqXHR){
            // log a message to the console
            object.attr("title", response["results"][0]["formatted_address"]);
            object.data("geo-located", "1");
        });

        request.fail(function (jqXHR, textStatus, errorThrown){
        	object.data("geo-located", null);
            // log the error to the console
            console.log("The following error occured: "+ textStatus, errorThrown);
            object.data("geo-located", "");
        });
	},
});

App.Config = PervasteredConfig;

App.Store = DS.Store.extend({
	revision: 12,
	adapter: DS.RESTAdapter.extend({
		url: App.Config.Pervastered.API
	})
});



// ==========================================
//  Authentication
// ==========================================

App.Auth = Ember.Auth.create({
	signInEndPoint: '/auth',
	signOutEndPoint: '/auth',
	baseUrl : App.Config.Pervastered.API,
	tokenKey : "token",
	tokenIdKey : "id",
	tokenHeaderKey : "token",
	userModel : "App.User",
	sessionAdapter : 'localStorage',
	modules : ['rememberable', 'authRedirectable', 'actionRedirectable', 'emberData'],
	rememberable : {
		tokenKey : "remember_token",
		period : 14,
		autoRecall : true,
	},
	authRedirectable : {
		route : "sign_in"
	},
	actionRedirectable : {
		signOutRoute : 'sign_in',
	},
	userEmail : (function() {
		return localStorage.getItem("email");
	}())
});

App.Auth.on("signInSuccess", function () {
	var handlers = App.Router.router.currentHandlerInfos;

	if (handlers.length > 1 && handlers[1].name == "sign_in") {
		Ember.run.next(function(){
			App.Router.router.transitionTo("index");
		});
	}
});

App.Auth.on("signInError", function () {
	console.log("Sign In error");
});

App.Auth.on("authAccess", function(){
	console.log("authAcess");
});


// ==========================================
//  Comments
// ==========================================
function disqus_config() {
	// OBS: this function is called by the embed.js script so it has to be defined in the global scope to be seen.
	this.callbacks.onReady = [function() { App.Comments._onDISQUSReady(); }]
}

App.Comments = (function() {
	var initiated = false,
		deferred = $.Deferred();

	// DISQUS binding start
	// ============================
	function initDISQUS() {
		if (initiated) return;

		/* * * CONFIGURATION VARIABLES: THIS CODE IS ONLY AN EXAMPLE * * */
		var disqus_shortname = App.Config.Disqus.id; // Required - Replace example with your forum shortname
		var disqus_identifier = 'index';
		var disqus_title = 'Index';
		initiated = true;

		/* * * DON'T EDIT BELOW THIS LINE * * */
		(function() {
		    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
		    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';

		    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
		})();
	}

	function DISQUSloaded() {
		if ((typeof DISQUS === 'undefined') || !DISQUS.hasOwnProperty('reset')) {
			initDISQUS();

			return deferred.promise();
		}
	}

	function loadDISQUSComment(id) {
		DISQUS.reset({
		  reload: true,
		  config: function () {
		    this.page.identifier = id;
		    this.page.title = id;
		    this.page.url = window.location.origin + window.location.pathname + "#!" + window.location.hash.substring(1);
		  }
		});
	}

	// Public methods
	// ============================
	function load(id) {
		$.when(DISQUSloaded())
		 .then(function() {
		 	loadDISQUSComment(id);
		 });
	}

	function onDISQUSReady() {
		deferred.resolve();
	}

	return {
		load: load,
		// OBS: this method is marked as "private" but it is exposed because it has
		// to be accessed from App.Comments in the global scope when disqus_config
		// is called.
		_onDISQUSReady: onDISQUSReady
	};
})();


// ==========================================
//  Router
// ==========================================


App.Router.map(function() {
	this.resource("index");
	this.resource("players", function() {
		this.resource("player", { path: ":player_id"}, function() {
			this.route("close");
		});
	});
	
	this.resource("rituals", function() {
		this.resource("ritual", { path: ":ritual_id"}, function() {
			this.route("close");
		});
	});
	this.resource("quests", function() {
		this.resource("quest", { path: ":quest_id"}, function() {
			this.route("close");
		});
	});
	this.resource("messages", function() {
		this.resource("message", { path: ":message_id"}, function() {
			this.route("close");
		});
	});
	this.resource("general");
	this.route("sign_in");
	this.route("sign_out");
});

App.Router.reopen({
    handleURL: function (url) {
        try {
            return this._super(url);
        } catch (error) {
            if (error.message.match(/No route matched the URL/)) {
                return this._super('/index');
            }
        }
    }
});

App.ApplicationRoute = Ember.Route.extend({
	events: {
		signOut : function (){
			App.Auth.signOut();
		},
		showModal: function(options) {
			var options = {};
			var modalController = this.controllerFor('modal');

			modalController.setProperties({"title": "hola"});

			this.render('modal', {
				into: "application",
	        	controller: modalController,
	        	outlet: "modal"
	        });
	        $('#myModal').modal('show');
	        console.log("modal");
		},

	    dismissModal: function() {
			this.controllerFor('modal').reset();

			this.clearOutlet('application', 'modal');
	    },
	},

	clearOutlet: function(container, outlet) {
		parentView = this.router._lookupActiveView(container);
		parentView.disconnectOutlet(outlet);
	}
});


App.LogedRequiredRoute = Ember.Route.extend(App.Auth.AuthRedirectable).extend({
	activate: function() {
		this._super();
		App.Auth.on('signInComplete', this.get("onSignInComplete")());
	},
	onSignInComplete: function() {
	},
});


App.SignInRoute = Ember.Route.extend({
	activate: function() {
		this._super();

		if (App.Auth.get("signedIn")) {
			this.router.transitionTo("index");
		}
	}
});
App.SignInController = Ember.ObjectController.extend({
  email: null,
  password: null,
  signIn: function() {
  	var email = this.get('email');
  	localStorage.setItem("email", email);

    App.Auth.signIn({data : {
	      "email": email ,
	      password: this.get('password')
      }
    });
  }
});


App.SignOutRoute = Ember.Route.extend();
App.SignOutController = Ember.ObjectController.extend({
	signOut : function (){
		 App.Auth.signOut();
	}
});


App.ModalController = Ember.ObjectController.extend({
	title: "hola",
	init: function() {
	    this._super();

		console.log("render init");
	},
	renderTemplate: function(template) {
		this._super();
		console.log("render template");

	}
});


//========================================================================
//
//   App views
//
//========================================================================

App.ModalView = Ember.View.extend({
	templateName: "modal",
	didInsertElement: function() {
		console.log("started modal");
	},
	willInsertElement: function() {
		console.log("WTD");
	},
	render: function(context) {
		console.log("context");
	}
})

App.MapView = Ember.View.extend({
	templateName: "map",
	didInsertElement :  function() {
		this._super();
		App.loadTardis();
		// TO-DO FIX THIS CREATES COUPLING!!!!!
		var padding = (App.Router.router.currentHandlerInfos[1].name == "general") ? "": "70px";

		$("#map-container").css("padding-right", padding);
  		links.Tardis.prototype.renderView();
	}
});


App.ListMapView = Ember.View.extend({
	templateName : "list_map",
	layoutName : "base_layout",
	search_general_hint : "a OR b, a AND b, - to negate",
	rowHeight : 86,
});
   
App.GeneralView = App.MapView.extend({
	layoutName : "base_layout",
});

App.CodenameHeroesView = Ember.View.extend({
	didInsertElement : function() {
		this._super();
		var model = this.get("controller").get("model"),
			generalController = this.get("controller.controllers." + this.get("controller.needs")[0]),
			openedInfo = generalController.get("openedInfo");

		links.Tardis.prototype.focusMarker(model.id);
		generalController.set("openedInfo", model.id);


		var contentDiv = this.$().parent();
		if (contentDiv.css("display") == "none") {
			contentDiv.css("display", "");
			if (model.id != openedInfo) contentDiv.addClass("animated fadeInRightBig");
		}
		this.loadGeneral();
	},
	willClearRender : function() {
		this._super();
		var contentDiv = this.$().parent();

		if (contentDiv.css("display") != "none") {
			contentDiv.removeClass("fadeInRightBig").addClass("animated fadeOutRightBig");
			window.setTimeout( function(){contentDiv.removeClass('fadeOutRightBig').addClass("fadeInRightBig")},300);
		}
	},
	loadGeneral : function() {
		this.autoLoadLocation();
		var questJSON = $("#quest-visualization");
		if (questJSON.length > 0) {
			QuestVisualizer.LoadQuestVisualization(questJSON.data("json-visualization"));
		}

		/* ---------- Tabs ---------- */
		$('#myTab a:last').tab('show');
		$('#myTab a').click(function (e) {
			e.preventDefault();
			$(this).tab('show');
		});
		$('#buttonInfo a').click(function (e) {
			e.preventDefault();

			var tabButton = $(".tab-button."+this.getAttribute("href").substr(1));
			if (tabButton.length > 0) {
				$(".tab-button").toggleClass("active", false);
				tabButton.toggleClass("active");
				$(this).tab('show');
			}

		});
		/* ---------- Circles ---------- */
		circle_progess();
	},
	autoLoadLocation : function() {
	    var object = $("#location-auto-load");
	    if (object.length > 0) {
	        var request = $.ajax({
	            url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+ object.data("latitude") +","+ object.data("longitude")+"&sensor=false",
	            type: "get"
	        });

	        request.done(function (response, textStatus, jqXHR){
	            // log a message to the console
	            object.html(response["results"][0]["formatted_address"]);
	        });
	    }
	},
	rowHeight : 22
});

App.ListView = Ember.ListView.extend({
  height: 856,
  rowHeight: 105,
  elementWidth: 383,
  width: 400,
  itemViewClass: Ember.ListItemView,
  didInsertElement: function() {
  	this._super();
  	// Loading previous scroll level of the view
  	var controller = this.get("controller"),
  		element = this.get('element'),
  		scrollTop = controller.get("scrollTop");

  	if (scrollTop) {
  		Ember.run(this, this.scrollTo, scrollTop);
  	}
  	this._logScrollTop = function(evt) { controller.set("scrollTop", evt.target.scrollTop);};
    element.addEventListener('scroll', this._logScrollTop);
  },
  willDestroyElement : function() {
  	var element = this.get('element');

  	element.removeEventListener('scroll', this._logScrollTop);
  	this._logScrollTop = undefined;
  }
});

App.DisqusView = Ember.View.extend({
	templateName : "disqus",
    didInsertElement: function() {
    	// TO-DO find a better fix for properly updating url
    	var url = this.get("controller").target.get("url");
    		id = App.Router.router.currentHandlerInfos[0].handler.controller.destiny,
    		urlId = url.indexOf("#");

    	if (urlId == -1) {
    		if (id) {
    			window.location.hash +="/"+id;
    		}
    	} else {
    		id = url.substring(urlId);
    	}

    	this.set("id", id);
	   	App.Comments.load(id);
    }
});

App.CodenameHeroesBaseController = Ember.ArrayController.extend({
	overlaysOptions : [],
	addOverlay : function(overlay) {
		var overlays = this.get("overlaysOptions");

		if (overlays.indexOf(overlay) == -1) {
			overlays.push(overlay);
		}
	},
	removeOverlay : function(overlay) {
		var overlays = this.get("overlaysOptions"),
			index = overlays.indexOf(overlay);

		if (index != -1) {
			delete overlays[index];
		}
	},
	updateMapOverlays : function() {
		var mapOverlayers = this.get("overlaysOptions"),
	    	mapLayers = links.Tardis.prototype.mapLayers;

	    if (mapLayers) {
	    	var layers = mapLayers._layers;
		    for (var i in layers) {
		    	var layer = layers[i];

		    	if (mapOverlayers.indexOf(layer.name) == -1) {
		    		links.Tardis.prototype.removeOverlay(layer);
		    	} else {
		    		links.Tardis.prototype.addOverlay(layer);
		    	}
		    }
	    }
	},
	openedInfo: "", 
	closeInfo : function() {
		$('#general-content').removeClass('fadeInRightBig').addClass('animated fadeOutRightBig');
		this.set("openedInfo", undefined);
		links.Tardis.prototype.hideOpenLabels();


		window.setTimeout( function(){
			$('#general-content').removeClass('animated fadeOutRightBig').css('display','none');
			App.Router.router.transitionTo(App.Router.router.currentHandlerInfos[1].name + ".index");
		}, 300);
	}
});

App.CodenameHeroesController = App.CodenameHeroesBaseController.extend({
	content : [],
	list : [],
	query : "",
	queryStructure : undefined,
	contentListener : function() {
	}.observes("content"),
	listListener : function() {
		var elements = this.get("list");
		elements.addObserver("isUpdating", function() {
			if (this.get("isUpdating") == false) {
			}
		});
	}.observes("list"),
	rowHeight: "82",
	scrollTop: undefined,
});

App.CodenameHeroesItemController = Ember.ObjectController.extend({
	closeInfo : function() {
		var controller = this.get("controllers."+ this.get("needs")[0]);
		controller.send("closeInfo");
	}
});

App.IndexRoute = App.LogedRequiredRoute.extend({
	activate: function() {
		this._super();
		// We reload twitter
		(function(d,s,id) {
			var js,fjs=d.getElementsByTagName(s)[0];
			js=d.createElement(s);
			js.id=id;
			js.src="http://platform.twitter.com/widgets.js";
			fjs.parentNode.insertBefore(js,fjs);
		})(document,"script","twitter-wjs");
	},
});

App.IndexView = Ember.View.extend({
	layoutName : "base_layout",
	init: function(){ 
		this._super();
	}
});



App.CodenameHeroesBaseRoute = App.LogedRequiredRoute.extend({
	timeout : null,
	it: 0,
	activate: function() {
		this._super();
		this.setInterval();
	},
	setupController: function(controller, model) {
		this._super(controller, model);
	    links.Tardis.prototype.controller = controller;
	    controller.send("updateMapOverlays");
  	},
  	updateValues: function() {
  		if (App.Auth.get("signedIn")) {
  			// TO-DO make this model more abstract
  			// Players must be loaded first because message location depends on player location
	  		var models = [App.Player, App.Ritual, App.Message],
	  			it = parseInt(this.get("it")),
	  			result = models[it].find();

	  		links.Tardis.prototype.updateElements(result);
	  		this.set("it", (it + 1) % models.length);
	  		this.get("controller").send("search");
  		}
  	},
  	setInterval: function() {
  		var context = this;
  		// TO-DO (BUG) find() does not fire call to REST API if called immediatelly
		this.set("timeout", setInterval(function() {
			Ember.run.scheduleOnce("actions", context, "updateValues");
	    }, 2000));
  	},
	exit: function() {
		this._super();
		window.clearInterval(this.get("timeout"));
	}
});



App.CodenameHeroesRoute = App.CodenameHeroesBaseRoute.extend({
	setupController: function(controller, model) {
	    this._super(controller, model);
	    if (App.Auth.get("signedIn")) controller.set("list", this.get("class")().find());
	    $("#prependedInputButton").val(controller.get("query"));
	    controller.send("search");

	    var openedInfo = controller.get("openedInfo"),
	    	currentHandlerInfos = App.Router.router.currentHandlerInfos;

	   	// TO-DO fix for this to avoid checking if last part of the route is a resource group (isDynamic == true)
	   	// We just want to redirect if we are loading the main group url => route previous to last position isDynamic 
	    if (currentHandlerInfos && !(currentHandlerInfos[currentHandlerInfos.length-2].isDynamic)) {
		    if (openedInfo) {
		    	var itemClass = this.get("class")(),
		    		itemRoute = this.get("itemRoute"),
		    		router = this.router;

		    	Ember.run.next(function(){
		    		router.transitionTo(itemRoute, itemClass.find(openedInfo));
		    	});
		    }
	    }
  	},
	model : function() {
		if (App.Auth.get("signedIn"))
			return this.get("class")().find();
		else 
			return [];
	},
	events : {
		search : function(evt) {
			var query = $("#prependedInputButton").val(),
				className = this.get("class")(),
				previousQuery = this.get("controller.query"),
				queryValues,
				elements = this.get("controller.list"),
				results = [],
				previousResults = this.get("controller.content.content");

			// Recompute queryStructure just if query has changed
			if (query != previousQuery) {
				this.set("controller.query", query);
			
				if (query != "" && query != undefined) {
					queryValues = query.split(" AND ");

					for (var i = 0; i < queryValues.length; ++i) {
						var value = queryValues[i];

						if (value != "") {
							queryValues[i] = value.split(" OR ");

							for (var j = 0; j < queryValues[i].length; ++j) {
								var term = queryValues[i][j].trim().toLowerCase();

								if (term[0] == "\"") {
									term = term.replace(/\"/g,"");
								}

								queryValues[i][j] = term;
							}
						}
					}

					this.set("controller.queryStructure", queryValues);
				}
			} else {
				queryValues = this.get("controller.queryStructure");
			}

			if (query != "" && query != undefined) {
				results = elements.filter(function(item, index, enumerable) { 
					for (var i = 0; i < queryValues.length; ++i) {
						var search_term = item.get("search_term"),
							value = queryValues[i];

						if (value != "") {
							var found = false;
							for (var j = 0; !found && j < value.length; ++j) {
								var term = value[j],
									negate = false;

								if (term[0] == "-") { 
									negate = true;
									term = term.substring(1);
								} else {
									negate = false;
								}
								var index = search_term.indexOf(term);

								if ((negate && index == -1) || (!negate && index != -1)) {
									found = true;
								}
							}
							if (!found) return false;
						}
					}
					return true;
				});
			} else results = elements;

			this.set("controller.content", results);

			var result = results.get("content");
			if (result) {
				results = result;
			}

			var ids = [];
			for (var i = 0; i < results.length; ++i) {
				ids[results[i]["id"]] = true;
			}

			if (this.get("class")() == App.Quest) {
				ids = undefined;
			}
			// TO-DO There could be problems if there are new markers
			if (!previousResults || results.length != previousResults.length) links.Tardis.prototype.highlight(ids);
		}
	}
});



App.CodenameHeroesItemRoute = App.LogedRequiredRoute.extend({
	init : function() {
		if (this.router.router.currentHandlerInfos == undefined) {
			var hashSplited = window.location.hash.split("/"),
				router = this.router,
				transitionTo = this.get("class") +"s.index";


			this.controllerFor("application").set("destiny", hashSplited[2]);

			Ember.run.next(function(){
				router.transitionTo(transitionTo);
			});
		}
	},
	setupController : function(controller, model) {
		var clientId = model.clientId; 

		// TO-DO We have loaded an object instead of a proper Store class object
		// This happends when you click a summary
		if (!model.clientId) {
			var clientIds = controller.store.clientIdToId;
			for (var id in clientIds) {
				if (clientIds.hasOwnProperty(id)) {
					var clientId = clientIds[id];
					if (clientId == model.id) {
						model = controller.store.recordCache[id];
						break;
					}
				}
			}
			this.set("controller.model", model);
		}

		this._super(controller, model);
		var generalController = controller.get("controllers." + this.get("class") + "s");

		if (generalController) {
			// POI when changing route
			//generalController.set("openedInfo", undefined);
		}
	}
});

App.CodenameHeroesSummary = Ember.View.extend({
	mouseEnter : function() {
		links.Tardis.prototype.onMouseEnterSummary(this.templateData.view.get("content")["id"]);
	},
	mouseLeave: function() {
		links.Tardis.prototype.onMouseLeaveEvent(this.templateData.view.get("content")["id"]);
	}
});


App.GeneralRoute = App.CodenameHeroesBaseRoute;
App.GeneralController = App.CodenameHeroesBaseController.extend({
	overlaysOptions : ["Players", "Rituals", "Messages"],
	search: function(evet) {
		links.Tardis.prototype.highlight(undefined);
	}
});



App.PlayerView = App.CodenameHeroesView;
App.PlayerRoute = App.CodenameHeroesItemRoute.extend({
	class : "player"
});
App.PlayerController = App.CodenameHeroesItemController.extend({
	needs: ['players']
});
App.PlayersView = App.ListMapView.extend({
	search_hint: "quests, messages, decoded-messages, unread-messages, rituals, located, team:",
});
App.PlayerSummaryView = App.CodenameHeroesSummary.extend({
	templateName: "player_summary",
});
App.PlayersController = App.CodenameHeroesController.extend({
	overlaysOptions: ["Players", "Heatmap", "Paths"]
});
App.PlayersRoute = App.CodenameHeroesRoute.extend({
	class: function() { return App.Player; },
	itemRoute : "player",
});



App.RitualView = App.CodenameHeroesView;
App.RitualRoute = App.CodenameHeroesItemRoute.extend({
	class : "ritual"
});
App.RitualController =  App.CodenameHeroesItemController.extend({
	needs: ['rituals']
});

App.RitualsView = App.ListMapView.extend({
	search_hint: "messages, located, owned",
});
App.RitualsController = App.CodenameHeroesController.extend({
	overlaysOptions: ["Rituals", "Ranges"]
});
App.RitualsRoute = App.CodenameHeroesRoute.extend({
	class: function() { return App.Ritual; },
	itemRoute : "ritual",
});

App.RitualSummaryView = App.CodenameHeroesSummary.extend({
	templateName: "ritual_summary"
});

App.QuestView = App.CodenameHeroesView.extend({
	onSubquestSelect: function() {
		// event is handled through the eventManager
	},
	eventManager: Ember.Object.create({
		change: function(event, view) {
			var selectedSubquest = $(event.target).val();
			// We remove the ') ' out of the select item
			selectedSubquest = selectedSubquest.substr(selectedSubquest.search(/\) /) + ") ".length);
			
			if (selectedSubquest != 'all') {
				$('.quest-player').hide();
				$('.' + selectedSubquest).show();
			} else {
				$('.quest-player').show();
			}
		}
	})
	//}
});

App.QuestRoute = App.CodenameHeroesItemRoute.extend({
	class : "quest"
});
App.QuestController =  App.CodenameHeroesItemController.extend({
	needs: ['quests']
});
App.QuestsView = App.ListMapView;
App.QuestsController = App.CodenameHeroesController.extend({
	overlaysOptions: ["Rituals", "Players", "Messages"]
});
App.QuestSummaryView = Ember.View.extend({
	templateName: "quest_summary"
});
App.QuestsRoute = App.CodenameHeroesRoute.extend({
	class : function() { return App.Quest; },
	itemRoute : "quest"
});


App.MessageView = App.CodenameHeroesView;
App.MessageRoute = App.CodenameHeroesItemRoute.extend({
	class : "message"
});
App.MessageController =  App.CodenameHeroesItemController.extend({
	needs: ['messages']
});
App.MessagesView = App.ListMapView.extend({
	search_hint: "to:, in:, delivered, decoded, unread, public, private, located",
});
App.MessagesController = App.CodenameHeroesController.extend({
	rowHeight: "105",
	overlaysOptions: ["Messages"]
});
App.MessageSummaryView = App.CodenameHeroesSummary.extend({
	templateName: "message_summary"
});
App.MessagesRoute = App.CodenameHeroesRoute.extend({
	class : function() { return App.Message; },
	itemRoute : "message"
});


//========================================================================
//
//   App model definition
//
//========================================================================


var attr = DS.attr;

App.CodenameHeroesBase = DS.Model.extend({
	name : attr("string"),
	type : attr("string"),
	overlay : "Generic",
	location_id : function() {
		return "location-"+this.get("id").substring(1);
	}.property("id"),
	search_term : function() {
		var last_known_location = this.get("last_known_location"),
			search_term = this.get("id") + " " + this.get("name") + " " + this.get("type") + " " + (last_known_location && last_known_location["latitude"] != "" ? " located " : "");

		return search_term.toLowerCase();
	}.property("id", "name", "type").cacheable()
});

App.Player = App.CodenameHeroesBase.extend({
	green_mana : attr("string"),
	team : attr("string"),
	red_mana : attr("string"),
	blue_mana : attr("string"),
	fake_player : attr("string"),
	experience : attr("string"),
	last_connect_time : attr("string"),
	available_rituals : attr("string"),
	messages_decoded : attr("string"),
	messages_coded : attr("string"),
	last_disconnect_time : attr("string"),
	last_known_location : attr("raw"),
	quests_count : attr("string"),
	nearby_distance : attr("string"),
	messages : attr("raw"),
	quests : attr("raw"),
	rituals : attr("raw"),
	overlay : "Players",
	class_name: "player",
	search_term : function() {
		var search_term = this._super() + " team:" + this.get("team");
		if (this.get("quests_count") != "0") search_term += " quests ";
		if (this.get("messages_decoded") != "0") search_term += " decoded-messages ";
		if (this.get("messages_coded") != "0") search_term += " unread-messages ";
		if (this.get("available_rituals") != "0") search_term += " rituals ";

		return search_term.toLowerCase();
	}.property("team", "quests_count", "messages_coded", "messages_decoded", "available_rituals", "last_known_location").cacheable(),
	summary_template : function () {
		return App.PlayerSummaryView;
	}.property(),
	class_type : function() {
		return App.Player;
	}.property()
});

App.Ritual = App.CodenameHeroesBase.extend({
	owner_id : attr("string"),
	owner_name : attr("string"),
	parent_name : attr("string"),
	active : attr("string"),
	last_known_location : attr("raw"),
	description : attr("string"),
	parent_id : attr("string"),
	parent_name : attr("string"),
	activity_time : attr("string"),
	messages_count : attr("string"),
	nearby_distance : attr("string"),
	red_mana_generation : attr("string"),
	green_mana_generation : attr("string"),
	blue_mana_generation : attr("string"),
	mana_per_hour : attr("string"),
	messages: attr("raw"),
	overlay : "Rituals",
	class_name: "ritual",
	search_term: function () {
		var search_term = this._super(),
			messages_count = this.get("messages_count"),
			owner = this.get("owner_id");

		if (messages_count != "0") search_term += " messages ";
		if (owner != "#0") {
			search_term += " owned " + this.get("owner") + " " + this.get("owner_name");
		}
			
		search_term += " " + this.get("parent_name");

		return search_term.toLowerCase();
	}.property("owner", "owner_name","parent_name").cacheable(),
	summary_template : function() {
		return App.RitualSummaryView;
	}.property(),
	class_type : function() {
		return App.Ritual;
	}.property()
});

App.Quest = App.CodenameHeroesBase.extend({
	exits : attr("raw"),
	sub_quests : function() {
		return QuestVisualizer.QuestStageCount(this.get("exits")) + 1; 
	}.property("exits").cacheable(),
	players : attr("string"),
	players_enrolled : function() {
		var players = this.get("players");
		players = (players == undefined ? 0 : parseInt(players)); 
		return players + QuestVisualizer.QuestPlayerCount(this.get("exits")); 
	}.property("exits", "players").cacheable(),
	player_list : attr("raw"),
	summary_template : function() {
		return App.QuestSummaryView;
	}.property(),
	unassigned_players: function() {
		var players = App.Player.all();
			players = players.get("content");

		return players;
	}.property(),
	json_visualization : function() {
	    return JSON.stringify(this.getProperties("id", "name", "exits", "type"));
	}.property("id", "name", "exits", "type").cacheable(),
	quest_structure : function () {
		var structure = [];
		QuestVisualizer.QuestJSONtoVisualization(this.getProperties("id", "name", "exits", "type"), structure);

		return structure;
	}.property("id", "name", "exits", "type").cacheable(),
	class_type : function() {
		return App.Quest;
	}.property(),
	overlay : "Quests",
	class_name: "quest",
});


App.Message = App.CodenameHeroesBase.extend({
	recipient_id : attr("string"),
	recipient_name : attr("string"),
	destination_id : attr("string"),
	destination_name : attr("string"),
	location_id : attr("string"),
	location_name : attr("string"),
	public : attr("string"),
	red_mana : attr("string"),
	blue_mana : attr("string"),
	green_mana : attr("string"),
	reply_to_id : attr("string"),
	reply_to_name : attr("string"),
	decoded : attr("string"),
	message_cost : attr("string"),
	last_updated : attr("string"),
	fixed_last_known_location : undefined,
	location_observer : function() {
		this.set("fixed_last_known_location", undefined);
	}.property("location_id"),
	last_known_location : function() {
		var last_location = this.get("fixed_last_known_location");
		if (!last_location) {
			// TO-DO this should be done using some sort of call that calls Ember without making it cause HTTP petitions
			var location = links.Tardis.prototype.elements[this.get("location_id")];

			if (location) {
				this.set("fixed_last_known_location", location.get("last_known_location"));
			} else {
				this.set("fixed_last_known_location", {"latitude": "", "longitude": ""});
			}
		}
		var location = links.Tardis.prototype.elements[this.get("location_id")];
		if (location) {
			return location.get("last_known_location");
		}

		return {"latitude": "", "longitude": ""};//this.get("fixed_last_known_location");
	}.property("location_id"),
	content : attr("string"),
	summary_template : function() {
		return App.MessageSummaryView;
	}.property(),
	search_term : function() {
		var search_term = this._super(),
			destination_id = this.get("destination_id"),
			recipient_id = this.get("recipient_id"),
			location_id = this.get("location_id"),
			decoded = (this.get("decoded") == "1");

		if (decoded) search_term += " decoded ";
		else search_term += " unread ";

		if (this.get("public") == "1") search_term += " public ";
		else search_term += " private ";

		search_term += " to:" + destination_id + " in:" + location_id + " to:" + this.get("destination_name") + " in:" + this.get("location_name");
		search_term += " to:" + recipient_id + " to:" + this.get("recipient_name");

		if (destination_id == location_id) {
			search_term += " delivered ";
		}
				
		return search_term.toLowerCase();
	}.property("destination_id", "location_id", "location_name", "destination_name", "recipient_name", "recipient_id").cacheable(),
	class_type : function() {
		return App.Message;
	}.property(),
	overlay : "Messages",
	class_name: "message"
});

DS.RESTAdapter.registerTransform('raw', {
    deserialize: function(serialized) {
        return serialized;
    },  
    serialize: function(deserialized) {
        return deserialized;
    }   
});


App.User = DS.Model.extend({
	user_id : attr("string"),
	email : attr("string"),
});



//========================================================================
//
//   Ember handlebars helpers
//
//========================================================================




Ember.Handlebars.registerBoundHelper("date", function(value, options) {
	var param = options.hash["format"],
		date = moment.unix(parseInt(value));
	
	switch (param) {
		case undefined:
			return date.format('MMMM Do YYYY, h:mm:ss a');
		case "now":
			return date.fromNow();
		default:
			return date.format(param);
	}
});

Ember.Handlebars.registerBoundHelper("float", function(number, options) {
	var precision = options.hash["precision"];

	if (precision != undefined) {
		precision = parseInt(precision);
	} else precision = 2;

	return parseFloat(number).toFixed(precision);
});

Ember.Handlebars.registerBoundHelper("length", function(array, options) {
	if (array != undefined) return array.length;
	return "";
});

Ember.Handlebars.registerBoundHelper("cleanid", function(id) {
	return id.substring(1);
});

Ember.Handlebars.registerBoundHelper("cut", function(string, options) {
	var maxLength = options.hash["length"];
	var dots = options.hash["dots"] ? "..." : "";

	if (string.length > maxLength) {
		string = string.substring(0, maxLength) + dots;
	}
	return string;
});

var toString = Object.prototype.toString,
	functionType = '[object Function]';

Ember.Handlebars.registerHelper('ifequal', function(v1, v2, options) {
  var v1 = options.contexts[0].get(v1);
  if(v1 != v2) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Ember.Handlebars.registerHelper('ifnotequal', function(v1, v2, options) {
  var v1 = options.contexts[0].get(v1);
  if(v1 != v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Ember.Handlebars.registerHelper('debug', function(v1, context) {
	var v1 = context.contexts[0].get(v1);
  	console.log(v1);
});