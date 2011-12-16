## Minion - Cross-Platform & Cross-Browser JavaScript Inheritance

The goal of Minion is to provide easy-to-use, easy-to-grasp inheritance support for JavaScript.

Minion enables you to easily namespace, create and extend custom classes.

####Features:

- Inheritance in JavaScript!?
- Dependency management
- Singleton classes
- Static classes, methods and properties
- Intuitive pub/sub
- this.__super() method support 
- Build tool for easy deployment (for browser-based applications)

Minion does all this, all while sporting a tiny footprint of 3.9k (minified and gzipped).

Minion currently supports Node.js IE7+, Safari 3+, Opera 9.0+ and Chrome (other browsers probably work, but have not been thoroughly tested).

####Some other cool little factoids:

- Fully ECMAScript 5 Strict Mode compliant.
- Passes JSHint with flying colors (with Assume : Browser, NodeJS).
- See no evil, do no evil. Zero use of eval, with and Function();
- Tests, tests, tests. You can be sure it works.
- Very well documented, lots o' comments.
- Minion does not touch native JavaScript prototypes. I.E. no Object.prototype.someSuperAwesomeMethod___weThink();
- Damage Control. No global pollution. All classes reside under the minion namespace. This is good, trust us.

## Getting Started

http://gigafied.github.com/minion/

## Documentation

JSDocs available at: http://gigafied.github.com/minion/docs/

## Contributing

We want you to contribute. Fork the project, issue a pull request. Ideally, if you are adressing a specific issue, please create an issue in GitHub and reference that issue in your commits.
Write a Unit Test for your fix, so that we can be sure any future updates don't undo all your hard work :)

We'd love to support more platforms. There is very, very little platform detection in minion's source code. (This is a good thing, we want to keep it this way).
Getting it to work on other platforms should be relatively simple, so feel free to lend a hand!

## License

See src/minion.js