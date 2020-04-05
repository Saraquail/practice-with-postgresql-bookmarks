const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks-fixtures'
)

describe('Bookmarks Endpoints', () => {
  let db = 'db'

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db) 
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  describe('GET bookmarks endpoint', () => {

    context('If there are no bookmarks', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, [])
      })
    })

    context('If there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('response with 200 and all of the bookmarks in the db', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks)
      })
    })
  })

  describe('GET /bookmarks/:id endpoint', () => {
    
    context('If there are no data', () => {

      it('responds with 404', () => {
        const bookmarkId = 982704
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, 
            { error: { message: 'Bookmark does not exist' } })
      })
    })

    context('If there are data', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark)
      })
    })

    context.skip('Given an XSS attack', () => {

      const maliciousInput = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: "https://url.to.file.which/does-not.exist",
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 0
      }

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousInput])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarkds/${maliciousInput.id}`)
          .expect(200)
          .expect(res => {
              expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
              expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
          })
      })
    })
  })
}) 
