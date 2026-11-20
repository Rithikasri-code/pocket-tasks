// register new custom element
document.addEventListener('DOMContentLoaded', () => {
	if (window.customElements.get('ts-todo') === undefined) {
		class TSTodo extends HTMLElement {
			connectedCallback() {
				// component ID
				this.componentID = this.getAttribute("id") || 'ajkdhkajsd'
				if (!this.getAttribute("id"))
					this.setAttribute("id", this.componentID)

				// get component options
				this.DB_NAME = this.getAttribute('db').split(',')[0] || 'myApp'
				this.DB_VERSION = this.getAttribute('db').split(',')[1] || 1
				this.DB_STORE = this.getAttribute('db').split(',')[2] || 'todo'

				this.categories = this.getAttribute('categories').split(',') || ["Urgent", "Not urgent", "For later"]
				this.fields = this.getAttribute('fields').split(',') || ["Title", "Note", "Date & Time"]
				this.actions = this.getAttribute('actions').split(',') || ["Delete", "Done", "Undo"]
				this.fieldsTypes = [{ field: "input", type: "text" }, { field: "textarea", type: null }, { field: "input", type: "date" }]
				this.buttons = this.getAttribute('buttons').split(',') || ["Add Task", "Save"]
				this.filters = this.getAttribute('filters').split(',') || ["All tasks", "Today", "Tomorrow", "Completed"]

				this.sampleNoteTitles = [
					"Buy groceries for the week",
					"Plan sprint tasks",
					"Ideas for weekend trip",
					"Books to read this month",
					"Meal prep reminders",
					"Call the dentist",
					"Workout routine updates",
					"Project brainstorming notes",
					"Fix bugs from user feedback",
					"Monthly budget checklist",
				]

				this.sampleNoteTexts = [
					"Remember to buy milk, veggies, snacks for kids, and coffee.",
					"Break down the sprint into 5–6 manageable tasks and assign priorities.",
					"Consider mountains or a short city break. Check hotel availability.",
					"Include at least one nonfiction and one fiction item each week.",
					"Prep three lunches ahead: pasta bowl, curry, roasted veggies.",
					"Schedule the appointment and check if Friday afternoon is free.",
					"Add core training twice a week and track improvements.",
					"Sketch a few ideas for the upcoming app redesign.",
					"Look into reported UI glitch on Android and refine loading state.",
					"Review bills, subscriptions, and set saving goals for next month.",
				]
				// initialize
				this.init()
			}

			renderCategories() {
				const fragment = new DocumentFragment()

				const dataLine = document.createElement('div')
				dataLine.classList.add('data-line')

				const label = document.createElement('label')
				label.setAttribute('for', `category_${this.componentID}`)
				label.textContent = 'Category'

				this.select = document.createElement('select')
				this.select.setAttribute('id', `category_${this.componentID}`)
				this.select.setAttribute('name', `category_${this.componentID}`)

				this.categories.forEach((category, index) => {
					const opt = document.createElement('option')
					opt.value = category
					opt.textContent = category
					this.select.append(opt)
				})
				dataLine.append(label, this.select)

				fragment.append(dataLine)
				return fragment
			}

			renderFields() {
				const fragment = new DocumentFragment()

				this.fields.forEach((field, index) => {
					const dataLine = document.createElement('div')
					dataLine.classList.add('data-line')
					const label = document.createElement('label')
					label.setAttribute('for', `field_${index}_${this.componentID}`)
					label.textContent = field

					const input = document.createElement(this.fieldsTypes[index].field)
					input.setAttribute('id', `field_${index}_${this.componentID}`)
					input.setAttribute('name', `field_${index}_${this.componentID}`)
					input.setAttribute(`field_${index}`, '')
					if (this.fieldsTypes[index].type != null)
						input.setAttribute('type', this.fieldsTypes[index].type)

					dataLine.append(label, input)
					fragment.append(dataLine)
				})

				this.submitBtn = document.createElement('button')
				this.submitBtn.textContent = this.buttons[0]
				fragment.append(this.submitBtn)

				return fragment
			}

			renderForm() {
				const fragment = new DocumentFragment()

				this.form = document.createElement('form')

				this.form.append(this.renderCategories(), this.renderFields())
				fragment.append(this.form)

				return fragment
			}

			renderFiltering() {
				const fragment = new DocumentFragment()
				const filtering = document.createElement('div')
				filtering.setAttribute('filtering', '')

				this.filters.forEach(filter => {
					const name = filter.replaceAll(' ', '')
					this[name] = document.createElement('button')
					this[name].setAttribute(name, '')
					this[name].textContent = filter

					filtering.append(this[name])
				})

				fragment.append(filtering)
				return fragment
			}

			DBOpen(db = this.DB_NAME, version = this.DB_VERSION) {
				const request = indexedDB.open(db, version)

				request.onerror = (event) =>
					console.error("An error occured when opening the database", event.error)

				request.onupgradeneeded = (event) => {
					const db = event.target.result
					let store = db.createObjectStore(this.DB_STORE, {
						keyPath: "id",
						autoIncrement: true,
					})
					store.createIndex("dateIdx", "date", { unique: false })
					store.createIndex("doneIdx", "done", { unique: false })
				}

				request.onsuccess = (event) => {
					const db = request.result

					const transaction = db.transaction(this.DB_STORE, "readonly")
					const store = transaction.objectStore(this.DB_STORE)

					let idQuery = store.getAll()

					idQuery.onsuccess = (event) => this.displayToDo(idQuery.result)

					transaction.oncomplete = (event) => db.close()
				}
			}

			DBRead(db, version, index, value) {
				const request = indexedDB.open(db, version)

				request.onsuccess = (event) => {
					const db = request.result

					const transaction = db.transaction(this.DB_STORE, "readonly")
					const store = transaction.objectStore(this.DB_STORE)
					const idx = index != null ? store.index(index) : false

					let idxQuery = idx.getAll(value)

					idxQuery.onsuccess = (event) => this.displayToDo(idxQuery.result)

					transaction.oncomplete = (event) => db.close()
				}
			}

			DBRemove(id, item) {
				const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

				request.onsuccess = (event) => {
					const db = request.result
					const transaction = db.transaction(this.DB_STORE, "readwrite")
					const store = transaction.objectStore(this.DB_STORE)
					store.delete(Number(id))
					item.remove()
					this.DBOpen()
				}
			}

			addToDo(title, text, category, done, date = new Date().toISOString()) {
				const obj = {
					title: title,
					text: text,
					category: category,
					done: done,
					date: date.split("T")[0],
				}

				const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

				request.onsuccess = (event) => {
					const db = event.target.result
					const transaction = db.transaction(this.DB_STORE, "readwrite")
					const store = transaction.objectStore(this.DB_STORE)
					store.put(obj)
					transaction.oncomplete = (event) => db.close()
				}
			}

			displayToDo(data) {
				const APP = this.app

				if (!data.length) {
					this.resetContent(APP)
					APP.textContent = "No tasks matching criteria"
					return
				}
				this.resetContent(APP)

				data.forEach((todo) => {
					const item = document.createElement("div")
					item.setAttribute("data-index", todo.id)
					item.setAttribute("todo", "")
					item.setAttribute("swipe", "")
					item.innerHTML = `
						<div>
							<header>${todo.title}</header>
							<p text>${todo.text}</p>
							<p category>${todo.category}</p>
							<time>${todo.date}</time>
						</div>`

					const doneBtn = document.createElement("button")
					doneBtn.setAttribute("mark", "")
					todo.done ? doneBtn.setAttribute("checked", "") : null
					doneBtn.textContent = todo.done ? this.actions[2] : this.actions[1]
					doneBtn.addEventListener("click", (e) => {
						setTimeout(() => this.markToDo(e.target.parentElement.dataset.index), 300)
					})
					item.append(doneBtn)
					this.itemsObserver.observe(doneBtn)

					const deleteBtn = document.createElement("button")
					deleteBtn.setAttribute("del", "")
					deleteBtn.textContent = this.actions[0]
					deleteBtn.addEventListener("click", (e) => {
						setTimeout(
							() => this.DBRemove(e.target.parentElement.dataset.index, item),
							300,
						)
					})
					item.prepend(deleteBtn)
					this.itemsObserver.observe(deleteBtn)

					APP.append(item)
				})
			}

			resetContent(el) {
				el.innerHTML = ""
			}

			pickRandom(arr) {
				return arr[Math.floor(Math.random() * arr.length)]
			}

			setObserver() {
				//set wheelDeltaMax & touchDeltaMax values
				const wheelDeltaMax = 50
				const touchDeltaMax = 120
				//obvserver needed to allow swipe actions
				this.itemsObserverOptions = {
					threshold: [],
					rootMargin: "100% 0% 100% 0%",
				}
				//fill in treshold array with values from 0 to 1 with 0.05 intervals
				//so we can find with moe precision when the item is within visible area
				for (let i = 0; i <= 1.0; i += 0.05) {
					this.itemsObserverOptions.threshold.push(i)
				}
				//define observer	
				this.itemsObserver = new IntersectionObserver((items, observer) => {
					items.forEach((item) => {
						//add "speed" of swipe or touch to the mix with wheelDelta or touchDelta
						if (item.isIntersecting &&
							Math.round(item.intersectionRatio * 100) === 100 &&
							(window.wheelDelta >= wheelDeltaMax || window.touchDelta >= touchDeltaMax)
						) {
							//delay action so it feels more natural
							setTimeout(() => item.target.click(), 500)
						}
					})
				}, this.itemsObserverOptions)
			}

			init() {
				this.DBOpen()
				this.render()
				this.bindEvents()
				this.setObserver()
			}

			render() {
				const div = document.createElement('div')
				this.app = document.createElement('div')
				this.app.setAttribute('app', '')
				div.append(this.renderFiltering(), this.app)
				this.append(this.renderForm(), div)
			}

			bindEvents() {
				this.submitBtn.addEventListener('click', e => {
					e.preventDefault()
					this.addToDoEvent()
				})

				this.filters.forEach((filter, index) => {
					const name = filter.replaceAll(' ', '')
					this[name].addEventListener('click', e => {
						e.preventDefault()
						this[`filter${index}`]()
					})
				})

				document.addEventListener('wheel', e => {
					window.wheelDelta = Math.abs(e.deltaX)
				})
				document.addEventListener('touchstart', e => {
					window.touchStart = e.touches[0].clientX
				})
				document.addEventListener('touchend', e => {
					window.touchEnd = e.changedTouches[0].clientX
					window.touchDelta = Math.abs(window.touchStart - window.touchEnd)
				})
			}

			addToDoEvent() {

				const titleInput = this.querySelector('[field_0]')
				const textInput = this.querySelector('[field_1]')
				const dateInput = this.querySelector('[field_2]')

				const categorySelect = this.select

				const title =
					titleInput.value != "" ? titleInput.value : this.pickRandom(this.sampleNoteTitles)
				const note =
					textInput.value != "" ? textInput.value : this.pickRandom(this.sampleNoteTexts)
				const category = categorySelect.options[categorySelect.selectedIndex].value
				const date =
					dateInput.value != "" ? dateInput.value : new Date().toISOString()
				const done = 0

				this.addToDo(title, note, category, done, date)

				this.form.reset()

				this.DBOpen()
			}

			markToDo(id) {
				const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

				request.onsuccess = (event) => {
					const db = event.target.result
					const transaction = db.transaction(this.DB_STORE, "readwrite")
					const store = transaction.objectStore(this.DB_STORE)

					const range = IDBKeyRange.only(id)
					let idQuery = store.get(Number(id))

					idQuery.onsuccess = (event) => {
						const obj = idQuery.result
						obj.done = obj.done ? 0 : 1
						store.put(obj)
						const doneBtn = document.querySelector(`[data-index="${id}"] [mark]`)
						doneBtn.toggleAttribute("checked")
						doneBtn.textContent = obj.done ? this.actions[2] : this.actions[1]
					}

					transaction.oncomplete = (event) => db.close()
				}
			}

			filter0() {
				this.DBOpen()
			}

			filter1() {
				this.DBRead(
					this.DB_NAME,
					this.DB_VERSION,
					"dateIdx",
					new Date().toISOString().split("T")[0],
				)
			}

			filter2() {
				this.DBRead(
					this.DB_NAME,
					this.DB_VERSION,
					"dateIdx",
					new Date(Date.parse(new Date()) + 86400000).toISOString().split("T")[0],
				)
			}

			filter3() {
				this.DBRead(this.DB_NAME, this.DB_VERSION, "doneIdx", 1)
			}

			broadcastEvent(name, detail = {}) {
				const cEvent = (this.isEmpty(detail)) ? new CustomEvent(name) : new CustomEvent(name, { detail: detail })
				this.dispatchEvent(cEvent)
			}
		}
		window.customElements.define("ts-todo", TSTodo)
	}
})

class TSCustomElement {
	constructor(el, customEl) {
		console.log(el, customEl)
		const elParent = el.parentNode
		const picker = document.createElement(customEl)
		elParent.insertBefore(picker, el)
		picker.append(el)
	}
}