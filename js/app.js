$(function() {
	let Todo = Backbone.Model.extend({
		defaults: {
			"title": "",
			"completed": false
		},

		toggleCompleted: function() {
			this.save({
				completed: !this.get("completed")
			})
		}
	});

	let TodoList = Backbone.Firebase.Collection.extend({
		model: Todo,
		url: "https://backbone-todo-d8c34.firebaseio.com"
	});


	let TodoView = Backbone.View.extend({
		tagName: 'li',

		initialize: function() {
		
		},

		render: function() {
			this.$el.append(`
				<div class="todo">
					<img  src="assets/images/completed-icon.png">
					<p>${this.model.get('title')}</p>
					<img class="delete" src="assets/images/delete-icon.png">
				</div>`);
			return this;
		}
	});


	let ListView = Backbone.View.extend({
		el: $('body'),

		initialize: function() {
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