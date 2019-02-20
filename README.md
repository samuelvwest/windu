## What WINDU does ##

* Sets up mutation system to make sure certain functions don't run until prior conditions are met based on DOM changes
* Great for triggering based off new or modified elements
* Bad for detecting javascript variable changes (unless you change the `detectType` to "poll")
* Debug what mutation have been established and their configuration/status by checking the `windu.data` variable

## How to use WINDU functions anywhere ##

1. Include the above file in the page before you need to use the function.

2. Use the `windu` variable now available globally. 
    * `windu.create(obj)` (primary use) – `obj` is JSON with some required and optional values.
        * `name` *Preferred* name of mutation/poll to prevent duplication and allow for simpler debugging. This will be autocreated if not provided.
        * `when` *Required* function that returns a boolean value to be tested on mutation (or polling if needed). Must be a function using the return operator.
        * `do` *Required* function to be run when the `when` value returns true
        * `detectType` *Optional* string that defaults to "mutation" when not provided. If "poll" is provided instead than a polling interval will be initiated using the `when` and `do` functions that must be provided in that case.
        * `attach` *Optional* function or CSS selector string to attach function to every new element
            * If is function, requires parent object to have the `selector` value to know what to attach the function to.
            * If is string, must be CSS selector. Will attach parent object `do` function to all elements matching CSS Selector.
            * `attach` and `selector`, if both provided, do not require the `when` and `do` functions to be present.
        * `selector` used by the `attach` variable to select new elements to attach a function to
        * `pollFirst` *Optional* function or boolean value that runs a `tao.f.poll` before setting up the mutation event
            * If function, runs the provided function for the polling test
            * If boolean value of "true", runs the provided `do` function for the polling test
        * `maxTimes` *Optional* Maximum number of times the `do` function can resolve as true before mutation is deactivated. 
            * For Attach mutations–defaults to 10,000
            * For WhenDo mutations-default to 1
        * `bipolor` *Optional* boolean value that alternates value of `do` function after evaluates to true. Helps to reduce duplication for elements that appear and disappear frequently. 
        * `consoleLog` *Optional* if provided and set to true will produce console logs for everything it does (can help with debugging)
    * `windu.data` This is where all windu functions run are logged and update so you can see what is happening with each one you "create"
    
3. Examples
    * Run something once an element exists on the page
        ```
        windu.create({
            name: 'dnaRegionsTextExists',
            when: function () {
                return !!document.querySelector('.dnaRegionsTextCon');
            },
            do: function () {
                console.log('REGION TEXT EXISTS!')
            }
        });
        ```
    * Modify/attach function to every element ever to exist on the page that matches a CSS selector
        ```
        windu.create({
            selector: '.ancBtn',
            attach: function (elem) {
                elem.style.backgroundColor = 'red';
            }
        });
        ```
    * Run function within 500ms of when a condition changes (best for non-DOM variable checks).
        ```
        windu.create({
            detectType: 'poll',
            name: 'checkThisVar',
            when: function () {
                return !!window.checkThisVar;
            },
            do: function () {
                console.log('IT IS TRUE NOW!');
            }
        });
        ```
