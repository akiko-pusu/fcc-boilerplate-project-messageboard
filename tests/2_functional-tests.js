const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  // set timeout to 5000 from 2000 (default) to prevent timeout error.
  this.timeout(5000);

  const date = new Date();
  const board = 'sample';
  const text = `sample_test_${date}`;
  const deletePassword = 'delete_me';
  let thread_id = '';
  let reply_id = '';

  test('POST request to /api/threads/:board', function (done) {
    const data = { text: text, delete_password: deletePassword };
    chai.request(server)
      .post(`/api/threads/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // Confirm POST result via GET result.
  test('GET request to /api/threads/:board', function (done) {
    chai.request(server)
      .get(`/api/threads/${board}`)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        const threads = res.body;
        thread_id = threads[0]._id;

        assert.equal(threads[0].text, text);
        assert.isNotNull(threads[0]._id);
        assert.equal(threads[0].bumped_on, threads[0].created_on);
        done();
      });
  });

  // Reply test
  test('POST request to /api/replies/:board with valid thread_id', function (done) {
    const data = {
      text: text,
      delete_password: deletePassword,
      thread_id: thread_id,
    };
    chai.request(server)
      .post(`/api/replies/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // Confirm POST result via GET result.
  test('GET request to /api/replies/:board with valid thread_id', function (done) {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${thread_id}`)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        const thread = res.body;
        assert.isObject(thread);
        assert.containsAllKeys(thread, ["_id", "text", "created_on", "bumped_on", "replies"]);
        assert.isArray(thread.replies);
        assert.notExists(thread.delete_password);
        assert.equal(thread.replies[0].thread_id, thread.id);

        reply_id = thread.replies[0]._id;
        done();
      });
  });

  test('DELETE request to /api/replies/:board with valid thread_id and reply_i with invalid_password', function (done) {
    const data = { thread_id: thread_id, reply_id: reply_id, delete_password: 'wrong_password' };
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "incorrect password");
        done();
      });
  });

  test('DELETE request to /api/replies/:board with valid thread_id and reply_id', function (done) {
    const data = { thread_id: thread_id, reply_id: reply_id, delete_password: deletePassword };
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });

  test('PUT request to /api/replies/:board with valid thread_id and reply_id', function (done) {
    const data = { thread_id: thread_id, reply_id: reply_id };
    chai.request(server)
      .put(`/api/replies/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, "reported");
        done();
      });
  });

  test('GET request to /api/replies/:board with valid thread_id after reply_id deleted', function (done) {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${thread_id}`)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        const thread = res.body;
        assert.isObject(thread);
        assert.equal(thread.replies[0].text, "[deleted]");
        assert.equal(thread.replies[0]._id, reply_id);
        done();
      });
  });

  test('DELETE request to /api/threads/:board', function (done) {
    const data = { thread_id: thread_id, delete_password: deletePassword };
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('PUT request to /api/threads/:board with invalid thread_id', function (done) {
    const data = { thread_id: thread_id };
    chai.request(server)
      .put(`/api/threads/${board}`)
      .send(data)
      .end(function (_err, res) {
        assert.equal(res.body.error, "Thread not found.");
        done();
      });
  });
});
