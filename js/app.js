$(function() {

	let Todo = Backbone.Model.extend({
		defaults: {
			"title": "",
			"completed": false
		},

		// Toggles the model.
		toggleCompleted: function() {
			this.save({
				completed: !this.get("completed")
			});
		}
	});

	let TodoList = Backbone.Firebase.Collection.extend({
		model: Todo,
		url: "https://backbone-todo-d8c34.firebaseio.com",

		active: function() {
	      return this.filter(function(todo) {
	        return !todo.get('completed');
	      });
    },

	});


	let TodoView = Backbone.View.extend({
		tagName: 'li',

		initialize: function() {
			_.bindAll(this, 'render', 'toggleModel', 'unrender');

			this.completed = this.model.get('completed');
			this.$todo = this.$('div.todo');

			// Listens to changes in the model to mark as complete or to delete it.
			this.listenTo(this.model, 'change:completed', this.render);
			this.listenTo(this.model, 'remove', this.unrender)
		},

		template: $('#todo-template').html(),

		events: {
			'click img.toggle': 'toggleModel',
			'click img.delete': 'deleteModel'
		},

		// Completes the template with the model properties(attributes).
		render: function() {
			this.$el.html(Mustache.to_html(this.template, this.model.attributes));
			return this;
		},

		// Toggles the model 'completed' to true or false.
		toggleModel: function() {
			this.model.toggleCompleted();
			return false;
		},

		// Eliminates the model.
		deleteModel: function() {
			this.model.destroy();
		},

		// Updates the view after the model has been deleted.
		unrender: function() {
			this.$el.remove();
		}

	});


	let ListView = Backbone.View.extend({
		el: $('body'),

		statsTemplate: $('#stats-template').html(),

		initialize: function() {
			_.bindAll(this, 'appendTodo', 'createOnEnter', 'render', 'appendAll', 'showCompleted', 'showActive', 'showAll',
				'clearCompleted', 'filter')

			this.$input = $('#todo-input');
			this.$todoList = $('#todo-list');
			this.$footer = $('footer');
			this.$completed = $('.todo-completed')

			this.todoCollection = new TodoList();

			// Saved models re-render automatically because it triggers 'add' event
			this.listenTo(this.todoCollection, 'add', this.appendTodo);
			this.listenTo(this.todoCollection, 'add', this.filter);
			this.listenTo(this.todoCollection, 'change:completed', this.filter)
			this.listenTo(this.todoCollection, 'reset', this.appendAll);
			this.listenTo(this.todoCollection, 'all', this.render)

			this.render();

		},

		events: {
			'keypress #todo-input': 'createOnEnter',
			'click #show-completed': 'showCompleted',
			'click #show-active': 'showActive',
			'click #show-all': 'showAll',
			'click #clear-completed': 'clearCompleted'
		},

		render: function() {
			this.remaining = this.todoCollection.active().length;
			this.$footer.html(Mustache.to_html(this.statsTemplate, this));
		},

		// Creates new todo and adds it to the collection.
		createOnEnter: function(e) {
			const ENTER_KEY = 13;
			if(e.which === ENTER_KEY && this.$input.val().trim()){
				this.todoCollection.create({
					title: this.$input.val(),
					completed: false
				})
				this.$input.val("");
			};
		},

		// Creates new individual view for the model and appends it to the html.
		appendTodo: function (todoModel) {
			let todoView = new TodoView({
				model: todoModel
			});
			this.$todoList.append(todoView.render().el);
		},

		appendAll: function(collection) {
			this.$todoList.html("");
			collection.forEach(this.appendTodo);
		},

		showCompleted: function() {
			this.appendAll(this.todoCollection.where({completed: true}));
			this.currentView = 'completed';
		},

		showActive: function () {
			this.appendAll(this.todoCollection.where({completed: false}));
			this.currentView = 'active';
		},

		showAll: function() {
			this.appendAll(this.todoCollection);
			this.currentView = 'all';
		},

		clearCompleted: function() {
			this.todoCollection.reset(this.todoCollection.active());
			this.currentView = 'all';
		},

		filter: function() {
			if(this.currentView === 'completed') {
				return this.showCompleted();
			}else if(this.currentView === 'active') {
				return this.showActive();
			}
			return this.showAll();
		}

	})

	let listView = new ListView();
})