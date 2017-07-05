$(function() {
	let Todo = Backbone.Model.extend({
		defaults: {
			"title": "",
			"completed": false
		},

		toggleCompleted: function() {
			this.save({
				completed: !this.get("completed")
			});

			console.log(this.get('completed'))
		}
	});

	let TodoList = Backbone.Firebase.Collection.extend({
		model: Todo,
		url: "https://backbone-todo-d8c34.firebaseio.com"
	});


	let TodoView = Backbone.View.extend({
		tagName: 'li',

		initialize: function() {
			_.bindAll(this, 'render', 'toggleModel', 'toggleView');

			this.$todo = this.$('div.todo');

			this.listenTo(this.model, 'change:completed', this.toggleView);
		},

		template: $('#todo-template').html(),

		events: {
			'click img.toggle': 'toggleModel'
		},

		render: function() {
			// this.$el.append(`
			// 	<div class="todo">
			// 		<img class='toggle' src="assets/images/completed-icon.png">
			// 		<p>${this.model.get('title')}</p>
			// 		<img class="delete" src="assets/images/delete-icon.png">
			// 	</div>`);
			this.$el.html(Mustache.to_html(this.template, this.model.attributes));
			return this;
		},

		toggleModel: function() {
			this.model.toggleCompleted();
			return false;
		},

		toggleView: function() {
			if(this.model.get('completed')){
				return this.$todo.addClass('completed');
			};
			return this.$todo.removeClass('completed');
		}

	});


	let ListView = Backbone.View.extend({
		el: $('body'),

		initialize: function() {
			// Saved models re-render automatically because it triggers 'add' event
			_.bindAll(this, 'appendTodo', 'createOnEnter')

			this.$input = $('#todo-input');
			this.$todoList = $('#todo-list')

			this.todoCollection = new TodoList();
			this.listenTo(this.todoCollection, 'add', this.appendTodo)

		},

		events: {
			'keypress #todo-input': 'createOnEnter',
		},

		render: function() {
		
		},

		createOnEnter: function(e) {
			const ENTER_KEY = 13;
			if(e.which === ENTER_KEY && this.$input.val().trim()){
				this.todoCollection.create({
					title: this.$input.val(),
					completed: false
				})
			};
		},

		appendTodo: function (todoModel) {
			let todoView = new TodoView({
				model: todoModel
			});
			this.$todoList.append(todoView.render().el);
			this.$input.val("");
		}
	})

	let listView = new ListView();
})