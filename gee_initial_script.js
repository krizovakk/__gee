//print("Hello World!");

// strings

var greetString = "Ahoy there!";
print(greetString);

// numbers

var number = 42;
print("The answer is", number);

// lists

var listOfNumbers = [0, 1, 1, 2, 3, 5];
print('List of numbers:', listOfNumbers);

var listOfStrings = ['a', 'b', 'c', 'd'];
print('List of strings:', listOfStrings);

// objects

var object = {
  foo: 'bar',
  baz: 13,
  stuff: ['this', 'that', 'the other thing']
};
print('Dictionary:', object);
// Access dictionary items using square brackets.
print('Print foo:', object['foo']);
// Access dictionary items using dot notation.
print('Print stuff:', object.stuff);

// functions

var reflect = function(element) {
  // Return the argument.
  return element;
};
print('A good day to you!', reflect('Back at you!'));
