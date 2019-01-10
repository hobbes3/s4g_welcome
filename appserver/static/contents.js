var initHash = location.hash;

require([
    'jquery',
    'underscore',
    'splunkjs/mvc/simplexml/controller',
    'splunk.util',
    'backbone',
    'collections/services/data/ui/Views',
    'models/services/data/ui/View',
    'bootstrap.affix',
    'bootstrap.scrollspy'
], function(
    $,
    _,
    DashboardController,
    SplunkUtil,
    Backbone,
    ViewsCollection,
    ViewModel
) {
    var TAGS = {
        'extension': {
            label: _('Extension').t(),
            tooltip: _('Uses external JS/CSS').t()
        },
        'new': {
            label: _('New Example').t(),
            tooltip: ''
        },
        'updated': {
            label: _('Updated Example').t(),
            tooltip: ''
        },
        'app_deps': {
            label: _('App Dependency').t(),
            tooltip: _('Requires installing other apps').t()
        }
    };

    var HIDE_MISSING_VIEWS = false;

    var DashboardsCollection = ViewsCollection.extend({
            model: ViewModel,
            initialize: function() {
                ViewsCollection.prototype.initialize.apply(this, arguments);
            },
            sync: function(method, collection, options) {
                options = options || {};
                options.data = options.data || {};
                var baseSearch = '(isDashboard=1 AND isVisible=1)';
                if(!options.data.search){
                    options.data.search = baseSearch;
                } else {
                    options.data.search = ['(',baseSearch,' AND ', options.data.search,')'].join('');
                }
                return ViewsCollection.prototype.sync.call(this, method, collection, options);
            }
        });

    DashboardController.onReady(function() {

        DashboardController.onViewModelLoad(function() {
            var app = DashboardController.model.app.get('app');
            var exampleInfoCollection = new Backbone.Collection();
            var exampleInfoLoaded = exampleInfoCollection.fetch({
                url: SplunkUtil.make_url('/static/app/' + app +'/exampleInfo.json'),
                cache: true
            });

            $.when(exampleInfoLoaded).then(function(){
                var categories = _.uniq(_.flatten(exampleInfoCollection.pluck('category')));
                var $nav = $('<ul class="nav nav-list"></ul>').data('offset-top', "50");
                var $contents = $('<div class="example-contents"></div>');
                _.each(categories, function(category){
                    var categoryFiltered = exampleInfoCollection.filter(function(exampleInfo) {
                        return _.flatten([exampleInfo.get("category")]).indexOf(category) > -1;
                    });
                    $nav.append($('<li></li>').append($('<a ></a>').attr('href', '#' + category.replace(/ /g,"_")).text(category)));
                    var categoryInfoCollection = new Backbone.Collection(categoryFiltered);
                    var $category= $('<section></section>').attr('id', category.replace(/ /g,"_"));
                    $category.append($("<h2></h2>").text(category));
                    var $categoryContents = $('<div class=""></div>').appendTo($category);
                    categoryInfoCollection.each(function(exampleInfo){
                        var id = exampleInfo.get('id');
                        var link = exampleInfo.get('link');
                        var url = link.base + (link.params ? "?" + $.param(link.params) : "");
                        var $example = $('<a class="example" target="_blank"></a>').attr('href', url);
                        var label = exampleInfo.get('title') || (view && view.entry.content.get('label') || id);
                        var $exampleTitle = $('<h3></h3>').text(label);
                        var $exampleImg = $('<img />').attr('src', SplunkUtil.make_url('/static/app/' + app +'/icons/' + (exampleInfo.get('id') + ".png")));
                        var $exampleDescription = $('<p></p>').html(exampleInfo.get('short-description'));
                        var $exampleContent = $('<div class="content"></div>').append($exampleTitle).append($exampleDescription);
                        var $tags =  $('<div class="tags"></div>').appendTo($exampleContent);
                        _.each(exampleInfo.get('tags'), function(tag){
                            $tags.append($('<span class="label"></span>').addClass(tag.replace(/ /g, "-")).text(tag));
                        });
                        $example.append($exampleImg).append($exampleContent);
                        $categoryContents.append($example);
                    });
                    $contents.append($category);
                });
                $('.dashboard-body').append($('<div class="row contents-body"></div>').append($('<div class="nav-bar-slide"></div>').append($nav)).append($contents));
                $nav.affix({
                    offset: { top: $nav.offset().top }
                });
                $('body').scrollspy();
                if (initHash) {
                    setTimeout(function() {
                        document.body.scrollTop = $(initHash).offset().top;
                    }, 100);
                }
            });

        });

    });

});
