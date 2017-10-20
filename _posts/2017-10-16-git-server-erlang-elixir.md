---
layout: post
title: Git Gud or Git Rekt
author: Mario Flach
author_href: http://github.com/redrabbit
date: 2017-10-16 08:10:00 +0100
---

I've been using Elixir quiet a lot lately and it has been nothing less than pure pleasure. The
language is delicious, tooling is top notch and frankly, BEAM and OTP have been a continuous
revelation to me.

One part of the "framework" I rarely had the chance to explorer is distributed applications. It's a
pitty as this might be the part Elixir/Erlang shines most at. But as a one-man software development
company, most of my clients barely require more than a single machine to fulfill their needs.

A few days ago, I saw a presentation called "[How we scaled GitLab for a 30k-employee company](https://www.youtube.com/watch?v=byZcOH92CiY)".
The presentation was very interesting and I asked myself if Elixir could be a good match for this
kind of job. After a while I though it might be a great learning project, I've put some toughts in it and wrote
down a brief feature list:

* Basic CRUD application for managing users and repositories.
* Flexible authentication and authoritation cababilities.
* No special environment requirements. Erlang, Elixir, that's it.
* Native support for Git `fetch` and `pull` over SSH and HTTP.
* Performant and scalable, able to handle important loads.

I also came with a name for the experiment: *git gud or git rekt*.

> "git gud", a intentionally misspelled phrase meaning "get good." Generally used to pock fun at
> and mock inexperienced players in a particular video game.
>
> --- [Urban dictionary](https://www.urbandictionary.com/define.php?term=GiT%20GuD), Git gud

# Git server setup 101

Setting up you own Git server is easy as 1, 2, 3:

1. Install `git` on the machine.
3. Provide access through at least one of the [Git protocols][git-protocols]: `git://`, `ssh://` and `http://`.
2. Create users and groups on the machine an give them access permissions appropriately.

*And ... that's it. You are pretty much ready to go!*

You could write a few scripts to help you automate tedious tasks such as creating new repositories,
server-side hooks, managing read/write permissions and authentication keys, etc.

If you want to go a step furter, writting your own Web front-end on top would be no rocket-
science and a basic working prototype could be implemented within a few hours.

Indeed, there are already dozens of open-source, self-hosted solutions written on top of the
standard Git implementation.

# Maintainability & scalability issues

The standard Git implementation is the most simple one to setup. It relies on the tools supplied
by `git` itself and providing access to repositories via HTTP and SSH is easy as installing `nginx`
and `sshd` and adding a few lines of configuration.

One major problem with this approach is the lack of flexibility:

* Git providing tools such as `git-receive-pack`, `git-upload-pack` and `git-upload-archive`
out-of-the-box makes it easy to get started really fast but also makes things more complicated if you
want fine-grain control over these commands.

* In order to authenticate and authorize Git `fetch` and `pull` commands over SSH, you have to
create necessary users and groups, setup a restricted login shell, provide SSH public-key(s),
handle access permissions through extended filesystem attributes, etc.

* Sames goes for the [Git "Smart HTTP" protocol][git-smart-http]. Configure Nginx to support Git over HTTP is
straight forward but handling authentication and authorization correctly is a different story.

*Various solutions are available to solve the absence of authorization features. [Gitolite][] for example,
provides a fully configurable authorization layer on top of Git. You could also us [PAM][] modules in
order to customize how authentication is handled for SSH and HTTP.*

An obvious problem related to the lack of flexibility is the direct impact it has on scalability.
In order to create a platform that can scale lineary and run on multiple machines, we must be able
to share relevant data in a distributed manner.

# A different approach with *libgit2*

Having to rely on the standard Git implementation doesn't seem to be the best match if we want to
customize and scale our platform. There are however alternative implementations: [JGit][] (Java),
[Dulwich][] (Python) and a more interesting one to use on the BEAM, [libgit2][].

The last one, libgit2, is a portable, pure C implementation of the Git core methods. It has bindings
for many languages, including Erlang/Elixir. The library also allows developers to provide their
own pluggable backends, which is a huge win for the goals we want to achieve.

Basicaly, instead of having to store Git internal data on disc, in the well-defined `.git` directory,
libgit2 allows you to use alternative storage backends. Currently, the [libgit2-backends][] repository
maintains by the libgit2 team provides a few custom database backends.

[GitLab]: https://gitlab.com
[git-protocols]: https://git-scm.com/book/id/v2/Git-on-the-Server-The-Protocols
[git-smart-http]: https://git-scm.com/book/gr/v2/Git-on-the-Server-Smart-HTTP
[PAM]: https://en.wikipedia.org/wiki/Pluggable_authentication_module
[Gitolite]: https://git-scm.com/book/en/v1/Git-on-the-Server-Gitolite
[JGit]: http://www.eclipse.org/jgit/
[Dulwich]: https://github.com/jelmer/dulwich
[libgit2]: https://libgit2.github.com
[libgit2-backends]: https://github.com/libgit2/libgit2-backends
