$(function() {
	let userId = undefined;

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
		url: function() {
			return `https://backbone-todo-d8c34.firebaseio.com/`+ userId
		} ,

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

			this.listenTo(this.todoCollection, 'all', this.render)

			// Saved models re-render automatically because of fetch from server delay.
			this.listenTo(this.todoCollection, 'add', this.appendTodo);

			// Listens to any changes on the collection to filter if necessary.
			this.listenTo(this.todoCollection, 'add', this.filter);
			this.listenTo(this.todoCollection, 'change:completed', this.filter)

			// Listens when ClearAll updates collection to re-render the view.
			this.listenTo(this.todoCollection, 'reset', this.appendAll);


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
			return this;
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

		// Updates the whole list.
		appendAll: function(collection) {
			this.$todoList.html("");
			collection.forEach(this.appendTodo);
		},

		// Function to sort by 'completed' todos.
		showCompleted: function() {
			this.appendAll(this.todoCollection.where({completed: true}));
			this.currentView = 'completed';
		},

		// Function to sort by 'active' todos.
		showActive: function () {
			this.appendAll(this.todoCollection.where({completed: false}));
			this.currentView = 'active';
		},

		// Function to sort by 'all' todos.
		showAll: function() {
			this.appendAll(this.todoCollection);
			this.currentView = 'all';
		},

		// Clears all the completed todos.
		clearCompleted: function() {
			this.todoCollection.reset(this.todoCollection.active());
			this.currentView = 'all';
		},

		// Keeps track of the current filter to be used on any new changes.
		filter: function() {
			if(this.currentView === 'completed') {
				return this.showCompleted();
			}else if(this.currentView === 'active') {
				return this.showActive();
			}
			return this.showAll();
		}
	})

	let LoginView = Backbone.View.extend ({
		el: $('#login-container'),

		loginTemplate: $('#login-template').html(),

		initialize: function() {
			_.bindAll(this, 'render', 'newUser', 'loginUser', 'render', 'newPassword', 'newEmail', 'newUserError', 'logout', 'logoutSuccesful', 'hideErrors');

			this.showLogin = true;
			this.render();
		},

		events: {
			'click #button-login': 'loginUser',
			'click #button-register' : 'newUser',
			'click #logout': 'logout',
			'keyup ': 'enterLogin',
		},

		render: function() {
			this.$el.html(Mustache.to_html(this.loginTemplate, this));
			return this;
		},

		// Creates a new user.
		newUser: function() {
			// Gets the value of the email and password from inputs.
			let email = this.$('#new-email').val().trim();
			let password = this.$('#new-password').val();
			let repeatPassword = this.$('#repeat-password').val();

			// Creates the new user. Throws error if error.
			if(password === repeatPassword) {
				firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
					let userCurrent = firebase.auth().currentUser;
				    	logUser(userCurrent);

				    	this.showLogin = false;
				    	this.render();

				}, function(error) {
					this.newUserError(error);
					console.log(error.message)
				}, this);
			}else {
				this.newPassword();
				console.log("Passwords don't match")
			}

			// Checks if User is Authenticated to create new data and begin with the app.
			function logUser(userCurrent) {
			    
				if (userCurrent) {
					// Creates new Data for user.
					function writeUserData(userId) {
						firebase.database().ref(userId).set({});
					};

					writeUserData(userCurrent.uid);

					userId = userCurrent.uid;

					// Executes the App.
					this.listView = new ListView();
					
					console.log(`New user created with e-mail: ${userCurrent.email}`);
				} else {
				    console.log('User is not signed in')
				}
			    
			}
		},

		// Logs in an existing user.
		loginUser: function() {
			// Gets the value of the email and password from inputs.
			let email = this.$('#existing-email').val().trim();
			let password = this.$('#existing-password').val();

			// Authenticates the existing User.
			firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
			    let userCurrent = firebase.auth().currentUser;
			    logUser(userCurrent);

			    this.showLogin = false;
			    this.render();
			    
			}, function(error) {
				this.newEmail(error);
			    console.log('error trying to log in');
			}, this);
			
			// Checks if User is Authenticated to direct client to its data.
			function logUser(userCurrent) {
				if (userCurrent) {

					userId = userCurrent.uid;

					// Executes the App.
					this.listView = new ListView();

					console.log(`User with e-mail: ${userCurrent.email} is loged in.`);
				} else {
				    console.log('User is not loged in')
				}
			}

		},

		newUserError(error) {
			this.addNewPassword = true;
			this.errorRegistering = error.message;
			this.render();
		},

		newPassword: function() {
			this.addNewPassword = true;
			this.errorRegistering = "Passwords don't match"
			this.render();
		},

		newEmail: function(error) {
			this.addNewEmail = true;
			this.errorLogin = error.message;
			this.render();
		},

		logout: function() {
			firebase.auth().signOut().then(function() {
			  this.showLogin = true;
			  this.showLogoutMessage = true;
			  this.logoutSuccesful();
			  this.hideErrors();

			  console.log('Logout succesful.')
			  
			  this.render();
			}, function(error) {
			  console.log(error.message)
			}, this);
		},

		logoutSuccesful: function() {
			var that = this;
			return setTimeout(function () {
				that.showLogoutMessage = false;
				that.render();
			}, 1000)
		},

		hideErrors: function() {
			this.addNewPassword = false;
			this.addNewPassword = false;
			this.addNewEmail = false;

			this.render();
		},

		enterLogin: function(e) {
			const ENTER_KEY = 13;
			let $userInputEx = $('#existing-email'),
				$passInputEx = $('#existing-password'),
				$userInputNew = $('#new-email'),
				$passInputNew = $('#new-password'),
				$repeatPassInputNew = $('#repeat-password')

			if(e.which === ENTER_KEY){
				if($passInputEx.is(':focus') || $userInputEx.is(':focus')){
					this.loginUser();
					return;
				}

				if($userInputNew.is(':focus') || $passInputNew.is(':focus') || $repeatPassInputNew.is(':focus')){
					this.newUser();
					return
				}
			};
		},

	});

	let loginView = new LoginView();
})

