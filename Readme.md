# Test Context Builder

In integration testing, it's sometime necessary to build a context (usually database state)
that involves setting up many objects. Test Context Builder lets you define a context and load it, or define another
context on top of it.

For example, let's say you need to test a money transfer operation between 2 accounts. You need the accounts, the users
who own the account and the banks. You can define test context like this.

```typescript
TestContext.define('base', () => {
  let ctx = {};
  ctx.bank = { id: 1, name: 'Localtown bank' };
  ctx.user = { id: 1, name: 'Bob', bankId: ctx.bank.id };
  ctx.userAccount1 = { id: 1, name: 'Checking', userId: ctx.user.id };
  ctx.userAccount2 = { id: 2, name: 'Saving', userId: ctx.user.id };
  return ctx;
});

describe('transfer money to same user', function() {
  beforeEach(function() {
    return dbCleaner.clean().then(() => {
      return tc.load('base');
    });
  });
  it('transfer from account1 to account2', function() {
    transfer(tc.context.user.account1, tc.context.user.account2);
    // write your expectation
  });
});
```

That's good for testing transfer between 2 accounts that belongs to the same user. Now, let's say you want to test
transfer between 2 accounts from 2 different users. We can reuse the base context and just add one more user.

```typescript
TestContext.define('user2', ['base'], (globalCtx) => {
  let ctx = {};
  ctx.user2 = { id: 2, name: 'Bob', bankId: globalCtx.bank.id };
  ctx.user2Account1 = { id: 3, name: 'Checking', userId: ctx.user2.id };
  ctx.user2Account2 = { id: 4, name: 'Saving', userId: ctx.user2.id };
  return ctx;
});
```

The second argument of `define` can be an array of dependencies. So in the above example,
`user2` context depends on `base` context. The objects of the context that has been defined is accessible through
`globalCtx` (the first arg of the function passed to the `define` function). So in this case we can set user2 bankId to
the already defined bank object in the `base` context.

You can define multiple dependencies, and load the predefined test contexts having the same dependency. The dependencies
will only be loaded once.

```typescript
tc.load(['base', 'user2']);
```
In that example, it will load `base` first and then `user2`. It will see that `user2` depends on `base` but because
`base` is already loaded, it will just load `user2`. So technically you can do this in reverse order and it will still
work the same.

```typescript
tc.load(['user2', 'base']);

// or just load 'user2', which will also load 'base'
tc.load(['user2']);
```

## Use for building database test context

You can use `test-context-builder` with [db-fabricator](https://github.com/reynardmh/db-fabricator.js). Here is an
example of the above case with `db-fabricator`.

```
TestContext.define('base', () => {
  let ctx = {};
  ctx.bank = Fabricator.fabricate('bank');
  ctx.user = Fabricator.fabricate('user', { bankId: ctx.bank.then(b => b.bankId) });
  return ctx;
});

```


## Install

```
$ npm install test-context-builder
```

## Contributing

### Build

```
$ tsc
```

### Running Test

Install ts-node to run the test without compiling to js first.

```
$ npm install -g ts-node
```

Run all tests

```
$ mocha --compilers ts:ts-node/register test/*
```

## License

MIT
