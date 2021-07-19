// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  //save reference to the database
  const db = event.target.result;

  //create an object store (table) called 'budget_tracker', set it to have auto incrementing primary key
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

//upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above)
  //or simply established a connection, save reference to db in global variable
  db = event.target.result;

  //check if app is online, if yes run uploadPizza() function to send all local db data to api
  if (navigator.onLine) {
    //not created yet
    uploadTransaction();
  }
};

request.onerror = function (event) {
  //log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object store for `new_transaction`
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadTransaction() {
  //open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  //access the object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  //get all records from store and set to a vriable
  const getAll = budgetObjectStore.getAll();

  // if the getAl execution was successfule run this function
  getAll.onsuccess = function () {
    console.log("uploadTransaction Function");
    //if there was data in the indexedDb store let's send it to the api
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          //open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");

          //access the new_transaction object store
          const budgetObjectStore = transaction.objectStore("new_transaction");

          //clear all items from store
          budgetObjectStore.clear();

          console.log("All store transactions have been submitted");
          alert("All store transactions have been submitted");
        })
        .catch((err) => console.log(err));
    }
  };
}

//listen for app coming back online
window.addEventListener("online", uploadTransaction);
