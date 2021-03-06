'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

