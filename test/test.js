const chai = require("chai")
let chaiHttp = require('chai-http');
const app= require("../index")
const should = chai.should

chai.use(chaiHttp)

it("should test /test endpoint",()=>{

    chai.request(app)
        .post("/dev/test")
        .end((err,res)=>{
            res.should.have.statusCode(200)
            res.body.should.have.a.property("message").eql("Works fine","Test works fine")
        })
})
