---
layout: post
title: Meteor DDP and Minimongo implementation in C++
summary: Announcing the first C++ implementation of DDP with latency compensation support.
author: Mario Flach
author_href: http://github.com/redrabbit
date: 2015-10-07 08:10:00 +0100
---

# Meteor, some design concepts

For those that have been living under a rock, [Meteor][] is a isomorphic JavaScript web framework that can be used to create modern, responsive web apps. The startup was incubated by [Y-Combinator][] and received $11.2M in funding from [Andreessen Horowitz][] in July 2012. It reached version 1.0 in October 2014 and in August 2015, Meteor surpassed Rails as the [most popular web application framework on Github](https://github.com/showcases/web-application-frameworks).

Before we get started, we have to go trough two major design concepts of the Meteor framework. If you are already familiar to Meteor you can skip this part and read further to learn more about the core implementations of [Meteor++][].

## Optimistic UI

“Latency Compensation” is one of the [Seven Holy Principles](http://docs.meteor.com/#/full/sevenprinciples) of Meteor, which – as the legend goes – were handed down to the Meteor Development Group engraved on a burning Meteorite in the year Two Thousand And Eleven.

Here’s how the documentation defines the term:

> Latency Compensation. On the client, Meteor prefetches data and simulates models to make it look like server method calls return instantly.

Meteor is the only framework that includes a first-class solution for this problem, and it's called [Minimongo][]. The same way that your database is a single source of truth for your server, Minimongo is a single source of truth for the client. If you have two widgets that display overlapping data, you can render them both from a reactive query on this client-side database and they are guaranteed to be consistent.

## DDP implementations

Though [DDP][] was originally developed by the Meteor Project, nothing about it is Meteor-specific. For the most part, DDP just provides a standard set of names for the messages that most any websocket-using application would already be sending.

So for example a mobile client written in pure Objective C, with no Meteor code, can connect to a Meteor server (say, by using the [ObjectiveDDP][] library), and the server doesn't see it as different from any other client.

Meteorpedia maintains a [list of independent implementations of DDP](http://meteorpedia.com/read/DDP_Clients). Unfortunally, none of them has been written in C++ and very few implement more than a barebones DDP client.

# Meteor++, a first iteration

Meteor does have [Cordova][] support, so you can package your website as an app and deploy to Android or iOS, but obviously that leaves you short when it comes to truly native look and feel, performance, and full range of APIs.

[Meteor++][] makes it easy to communicate with your Meteor app. The library implements version 1 of [DDP][], the Distributed Data Protocol, as well as fallbacks to *pre1* and *pre2*.

Rather than notifying you of individual data updates and leaving it at that, the library has been designed to bring full stack reactivity. Among other things, it includes full support for [latency compensation](https://www.discovermeteor.com/blog/latency-compensation) and supports writing your own method stubs. It keeps as close as possible to the semantics of the original Meteor JavaScript API.

If you are familiar to Meteor, you will feel right at home.

## Implementation

The library is written in modern C++ and should be platform agnostic. Altought is has been tested on OSX and Linux, Windows support is currently experimental. We use [Travis CI][] for continuous integration and [Coveralls][] to track code coverage over time.

To keep close to the original Meteor JavaScript API, Meteor++ requires [C++11][] features such as [anonymous functions](http://en.cppreference.com/w/cpp/language/lambda) (*aka.* closures), [list initialization](http://en.cppreference.com/w/cpp/language/list_initialization) and [variadic templates](http://en.cppreference.com/w/cpp/language/parameter_pack).

{% raw %}
```cpp
auto ddp = std::make_shared<meteorpp::ddp>(io);
ddp->connect("ws://localhost:3000/websocket", [&](std::string const& id) {
    // we're connected, subscribe to "posts"
    auto coll = std::make_shared<meteorpp::ddp_collection>(ddp, "posts");
    coll->on_ready([&]() {
        // we got the initial batch of data
        // let's track changes on a specific query
        auto live_query = coll->track({{ "published", true }});
        live_query->on_changed([&]() {
            // our dataset changed
            // clear the terminal & print the updated results
            system::clear();
            std::cout << live_query->data().dump(4) << std::endl;
        });
    });
});
```
{% endraw %}

Though it's 2015 already, the support for C++11 is still a bit sparse. Do not forget to set the necessary switches (*e.g.*, `-std=c++11` for GCC and Clang).

## Key Features

With this library you can:

* communicate with Meteor applications over Websockets
* subscribe to real-time feeds, track changes and observe specific queries
* call server-side methods, query and modify collections
* keep your data mirrored and simulate server operations (latency compensation)

## Restrictions

Meteor++ depends on the [EJDB][] library, a reimplementation of (almost) the entire [MongoDB][] API in C. The latter only support [ObjectID][] as type of the `_id` primary key of every document.

Meteor collections have the ability to specify an [option](http://docs.meteor.com/#/full/mongo_collection) that determines what type of ID generation method is used to generate new IDs for documents in that collection. By default, a random string generation function is used if no option is specified.

You must set the `idGeneration` option to `MONGO` when creating your Meteor collections:

```js
Posts = new Mongo.Collection("posts", {idGeneration: 'MONGO'});
```

Check EJDB [known limitations](http://ejdb.org/doc/limitations.html) for more details about this restriction. You may also want to take a look at the MongoDB [compatibility charts](http://ejdb.org/doc/mongodb.html) before you get started.

## Roadmap

Currently, the project is at an early development stage and not ready for production. It is covered by very few unit tests and the documentation is almost inexistant. The primary goal for version 1.0 is to get a stable, well tested and fully documented library.

## Get Involved

We incentivize everyone to contribute to [Meteor++][] and help us tackle existing issues!

If you find a bug, have trouble following the documentation or have a question about the project – [create an issue](https://github.com/almightycouch/meteorpp/issues)! There’s nothing to it and whatever issue you’re having, you’re likely not the only one, so others will find your issue helpful, too.

If you’re able to patch the bug or add the feature yourself – fantastic, [make a pull request](https://github.com/almightycouch/meteorpp/pull/new/master) with the code! Once you’ve submitted a pull request we can compare your branch to the existing one and decide whether or not to incorporate your changes.

[Andreessen Horowitz]: https://en.wikipedia.org/wiki/Andreessen_Horowitz
[Cordova]: http://cordova.apache.org
[Coveralls]: https://coveralls.io
[C++11]: https://en.wikipedia.org/wiki/C%2B%2B11
[DDP]: https://www.meteor.com/ddp
[EJDB]: http://ejdb.org
[Meteor]: https://www.meteor.com
[Meteor++]: https://github.com/almightycouch/meteorpp
[Minimongo]: https://www.meteor.com/mini-databases
[MongoDB]: https://www.mongodb.org
[ObjectID]: https://docs.mongodb.org/manual/reference/object-id/
[ObjectiveDDP]: https://github.com/boundsj/ObjectiveDDP
[Travis CI]: http://travis-ci.org
[Y-Combinator]: https://www.ycombinator.com

