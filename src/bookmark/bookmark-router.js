const express = require('express')
const logger = require('../logger')
const BookmarkService = require('./bookmark-service')

const bookmarkRouter = express.Router()
const parser = express.json()
// GET /bookmarks that returns a list of bookmarks

bookmarkRouter
  .route('/')

  .get((req, res, next) => {
    BookmarkService.getAllBookmarks(
      req.app.get('db')
    )
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })
// POST /bookmarks that accepts a JSON object representing a bookmark and adds it to the list of bookmarks after validation
  .post(parser, (req, res) => {
      const {title, url, description, rating} = req.body

      if (!title) {
          logger.error(`Title is required`);
          return res
              .status(400)
              .send('Invalid data');
          }

          if (!url) {
          logger.error(`URL is required`);
          return res
              .status(400)
              .send('Invalid data');
          }

          const id = uuid();

          const bookmark = {
          id,
          title,
          url,
          description, 
          rating
          };

          bookmarks.push(bookmark);

          logger.info('Bookmark with id ${id} created.')

          res
          .status(201)
          .location(`http://localhost:8000/bookmark/${id}`)
          .json(bookmark);
  })







// GET /bookmarks/:id that returns a single bookmark with the given ID, return 404 Not Found if the ID is not valid

bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    BookmarkService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if(!bookmark) {
          return res
            .status(404)
            .json({
              error: { message: 'Bookmark does not exist'}
            })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })

  .get((req, res) => {
    
    res.json({
      id: res.bookmark.id,
      title: res.bookmark.title,
      url: res.bookmark.url,
      description: res.bookmark.description,
      rating: res.bookmark.rating
    })
  })
// DELETE /bookmarks/:id that deletes the bookmark with the given ID.
  .delete((req, res) => {
    const { id } = req.params

    const bookmarkIndex = bookmarks.findIndex(
      item => item.id == id)

    if(bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`)
      return res
        .status(404)
        .send('Bookmark not found')
    }

    bookmarks.splice(bookmarkIndex, 1)
    
    logger.info(`Bookmark with id ${id} deleted`)

    res 
      .status(204)
      .end()
  })

  module.exports = bookmarkRouter