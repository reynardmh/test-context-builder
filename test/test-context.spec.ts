import { TestContext } from '../src/test-context';
import * as Promise from 'bluebird';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
let expect = chai.expect;

function randId() {
  let min = 1, max = 1000;
  return Math.floor(Math.random() * (max - min)) + min;
}

TestContext.define('base', () => {
  let curCtx: any = {};
  curCtx.org = { id: randId(), name: 'org' };
  curCtx.dept = { id: randId(), name: 'IT', orgId: curCtx.org.id };
  return Promise.props(curCtx);
});

TestContext.define('conflict-with-base', () => {
  return Promise.props({ org: {} });
});

TestContext.define('dept2', ['base'], (context) => {
  return Promise.props({
    dept2: { id: randId(), name: 'HR', orgId: context.org.id }
  });
});

TestContext.define('user', (context) => {
  return Promise.props({
    user: { id: randId(), name: 'bob', deptId: context.dept.id }
  });
});

TestContext.define('user-with-dependency', ['base'], (context) => {
  let curCtx: any = {};
  curCtx.user = { id: randId(), name: 'bob', deptId: context.dept.id };
  return Promise.props(curCtx);
});

TestContext.define('user2', ['base', 'dept2'], (context) => {
  let curCtx: any = {};
  curCtx.user2 = { id: randId(), name: 'Jane', deptId: context.dept2.id };
  return Promise.props(curCtx);
});

describe('TestContext', () => {
  let tc = new TestContext();
  beforeEach(() => {
    tc.clearContext();
  });

  it('load one test context', function() {
    return tc.load('base').then(context => {
      expect(context.dept.orgId).to.equal(context.org.id);
    });
  });

  it('throw error when creating undefined context', function() {
    return expect(tc.load('undefined-context')).to.eventually.be.rejectedWith(/is not defined/);
  });

  it('throw error when defining an existing context', function() {
    return expect(() => TestContext.define('base', () => Promise.resolve(1))).to.throw(/is already defined/);
  });

  it('load multiple test context in order', function() {
    return tc.load(['base', 'user']).then(context => {
      expect(context.dept.orgId).to.equal(context.org.id);
      expect(context.user.deptId).to.equal(context.dept.id);
    });
  });

  it('load shared context with dependency', function() {
    return tc.load('user-with-dependency').then(context => {
      expect(context.dept.orgId).to.equal(context.org.id);
      expect(context.user.deptId).to.equal(context.dept.id);
    });
  });

  it('throw error when another context is trying to override existing context key', function() {
    return expect(tc.load(['base', 'conflict-with-base'])).to.eventually.be.rejectedWith(/Context key: \w+ is already defined/);
  });

  it('loading multiple shared context, with the same dependency, does not load the dependency twice', function() {
    return tc.load(['base', 'user-with-dependency', 'user2']).then(context => {
      expect(context.dept.orgId).to.equal(context.org.id);
      expect(context.dept2.orgId).to.equal(context.org.id);
      expect(context.user.deptId).to.equal(context.dept.id);
      expect(context.user2.deptId).to.equal(context.dept2.id);
    });
  });
});
