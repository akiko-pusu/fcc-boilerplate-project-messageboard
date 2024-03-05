'use strict';

const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, {});

const Board = require("../models/boardsModel");
const Thread = require("../models/threadsModel");
const Reply = require("../models/repliesModel");


module.exports = function (app) {

  app.route('/api/threads/:board')
    .post([
      check('board', 'Board name is required').notEmpty(),
      check('text', 'Text message is required').notEmpty(),
      check('delete_password', 'Delete password is required').notEmpty()
    ], async (req, res) => {

      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      const boardName = req.params.board;
      console.log(`start to create or find board ${boardName}.`);

      const condition = { boardname: boardName };

      try {
        const board = await Board.findOneAndUpdate(condition, {}, {
          new: true,
          upsert: true // Make this update into an upsert
        });

        const current_datetime = new Date();
        let thread_condition = {
          boardname: boardName,
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: current_datetime,
          bumped_on: current_datetime,
          reported: false
        };

        let result = new Thread(thread_condition);
        await result.save();

        const thread_response = {
          id: result.id,
          boardname: result.boardname,
          created_on: result.created_on,
          bumped_on: result.bumped_on,
          text: result.text
        };

        // create Thread record.
        res.json(thread_response);
      } catch (error) {
        console.error(error);
        // return empty data
        res.json({ error: error });
      }
    })
    .get([
      check('board', 'Board name is required').notEmpty()
    ], async (req, res) => {
      // Viewing the 10 most recent threads with 3 replies each
      const boardName = req.params.board;
      const aggregate = await Thread.aggregate([
        { $match: { boardname: boardName } },
        { $project: { delete_password: 0, reported: 0, boardname: 0 } },
        { $limit: 10 }
      ])
        .sort({ created_on: -1 })
        .lookup({
          from: 'replies',
          localField: 'id',
          foreignField: 'thread_id',
          as: 'replies',
          pipeline: [{
            $project: {
              "delete_password": 0,
              "reported": 0,
              "__v": 0
            }
          }, { $sort: { created_on: -1 } }]
        });

      // return aggregated result
      res.json(aggregate);
    })
    .delete([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
      check('delete_password', 'Delete password is required').notEmpty()
    ], async (req, res) => {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      const boardName = req.params.board;
      console.log(`start to create or find board ${boardName}.`);

      let param_threadId = '';
      if (req.query.thread_id != undefined) {
        param_threadId = req.query.thread_id;
      } else {
        param_threadId = req.body.thread_id;
      }
      const threadId = new mongoose.Types.ObjectId(param_threadId);

      const condition = { boardname: boardName, _id: threadId };

      try {
        const thread = await Thread.findOne(condition);
        if (thread == undefined) {
          res.json({ error: 'Thread is not found.' });
          return;
        }
        if (thread.delete_password == req.body.delete_password) {
          await Thread.deleteOne(condition);
          res.send("success");
          return;
        } else {
          res.send("incorrect password");
          return;
        }
      } catch (error) {
        console.error(error);
        // return empty data
        res.json({ error: error });
      }
    })
    .put([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
    ], async (req, res) => {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      try {
        let param_threadId = req.body.thread_id;
        const threadId = new mongoose.Types.ObjectId(param_threadId);
        const condition = { _id: threadId };
        const update = { reported: true };
        const thread = await Thread.findOneAndUpdate(condition, update);
        if (thread != undefined) {
          res.send("reported");
          return;
        } else {
          throw new Error("Thread not found.")
        }
      } catch (error) {
        // console.error(error);
        // return empty data
        res.json({ error: error.message });
      }
    });

  app.route('/api/replies/:board')
    .post([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
      check('text', 'Text message is required').notEmpty(),
      check('delete_password', 'Delete password is required').notEmpty()
    ], async (req, res) => {

      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      const boardName = req.params.board;
      let param_threadId = '';
      if (req.query.thread_id != undefined) {
        param_threadId = req.query.thread_id;
      } else {
        param_threadId = req.body.thread_id;
      }
      const threadId = new mongoose.Types.ObjectId(param_threadId);
      console.log(`start to create or find board ${boardName}.`);

      const condition = { boardname: boardName, _id: threadId };

      const current_datetime = new Date();
      try {
        const thread = await Thread.findOneAndUpdate(condition, { bumped_on: current_datetime });
        if (thread == undefined) {
          res.json({ error: 'Thread is not found.' });
          return;
        }

        let reply_condition = {
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: current_datetime,
          bumped_on: current_datetime,
          reported: false,
          thread_id: thread.id
        };

        let result = new Reply(reply_condition);
        await result.save();

        const reply_response = {
          id: result.id,
          boardname: result.boardname,
          created_on: result.created_on,
          bumped_on: result.bumped_on,
          text: result.text
        };

        // create Thread record.
        res.json(reply_response);
      } catch (error) {
        console.error(error);
        // return empty data
        res.json({ error: error });
      }
    })
    .get([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
    ], async (req, res) => {
      // Viewing the 10 most recent threads with 3 replies each
      const boardName = req.params.board;
      let param_threadId = '';
      if (req.query.thread_id != undefined) {
        param_threadId = req.query.thread_id;
      } else {
        param_threadId = req.body.thread_id;
      }
      const threadId = new mongoose.Types.ObjectId(param_threadId);
      const aggregate = await Thread.aggregate([
        { $match: { boardname: boardName, _id: threadId } },
        { $project: { delete_password: 0, reported: 0, boardname: 0 } },
        { $limit: 1 }
      ])
        .sort({ created_on: -1 })
        .lookup({
          from: 'replies',
          localField: 'id',
          foreignField: 'thread_id',
          as: 'replies',
          pipeline: [{
            $project: {
              "delete_password": 0,
              "reported": 0,
              "__v": 0
            }
          }]
        });

      // return aggregated result
      res.json(aggregate[0]);
    })
    .delete([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
      check('reply_id', 'Reply id is required').notEmpty(),
      check('delete_password', 'Delete password is required').notEmpty()
    ], async (req, res) => {
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      const boardName = req.params.board;
      console.log(`start to create or find board ${boardName}.`);

      let param_threadId = '';
      if (req.query.thread_id != undefined) {
        param_threadId = req.query.thread_id;
      } else {
        param_threadId = req.body.thread_id;
      }
      const threadId = new mongoose.Types.ObjectId(param_threadId);

      const condition = { boardname: boardName, _id: threadId };

      try {
        const thread = await Thread.findOne(condition);
        if (thread == undefined) {
          res.json({ error: 'Thread is not found.' });
          return;
        }

        const replyId = new mongoose.Types.ObjectId(req.body.reply_id);
        const reply_condition = { _id: replyId };
        const current_datetime = new Date();

        const reply = await Reply.findOne(reply_condition);
        if (reply == undefined) {
          res.json({ error: 'Reply is not found.' });
          return;
        }
        if (reply.delete_password == req.body.delete_password) {
          const update = {
            text: "[deleted]",
            bumped_on: current_datetime
          };
          await Reply.findOneAndUpdate(reply_condition, update);
          // thread.bumped_on = current_datetime;
          // await thread.save();
          res.send("success");
          return;
        } else {
          res.send("incorrect password");
          return;
        }

      } catch (error) {
        console.error(error);
        // return empty data
        res.json({ error: error });
      }
    })
    .put([
      check('board', 'Board name is required').notEmpty(),
      check('thread_id', 'Thread id is required').notEmpty(),
      check('reply_id', 'Reply id is required').notEmpty()
    ], async (req, res) => {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.mapped());
        console.log("errors");
        return res.send({ errors: errors.mapped() });
      }

      let param_threadId = req.body.thread_id;
      let param_replyId = req.body.reply_id;
      const threadId = new mongoose.Types.ObjectId(param_threadId);

      const condition = { _id: threadId };

      try {
        const thread = await Thread.findOne(condition);
        if (thread == undefined) {
          res.json({ error: 'Thread is not found.' });
          return;
        }

        const replyId = new mongoose.Types.ObjectId(param_replyId);
        const reply_condition = { _id: replyId, thread_id: thread.id };

        const update = { reported: true };
        const reply = await Reply.findOneAndUpdate(reply_condition, update);
        if (reply != undefined) {
          res.send("reported");
          return;
        } else {
          throw new Error("Reply not found.")
        }
      } catch (error) {
        console.error(error);
        // return empty data
        res.json({ error: error });
      }
    });
};

/*

1.POST

Sample
http://localhost:3000/api/threads/first (POST)
---
board: first
text: sampletext
delete_password: pass
---
bord名はURLのパスから。
text, delete_password はフォームから。


db.threads.aggregate([
    {$match:{boardname:"fcc_test", id: "1" }},
    { $limit : 10 },
    {$lookup:
        {
            from:"replies",
            localField:"id",
            foreignField:"thread_id",
            pipeline: [{ $project: {
              "_id": 0,
              "delete_password": 0,
              "reported": 0,
              "__v": 0
              }
            }, { $limit : 3 }],
            as:"replies"
        }
    },
    {$project:
        {
            "_id": 0,
            "delete_password": 0,
            "reported": 0,
            "__v": 0
        }
    }
])

const aggregate = await Thread.aggregate([
  { $match: { boardname: 'fcc_test' } },
  { $project: { _id: 0, delete_password: 0, reported: 0 } },
  { $limit: 10 }
]);

*/
