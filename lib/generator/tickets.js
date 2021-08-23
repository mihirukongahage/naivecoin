const R = require('ramda');
const Ticket = require('./ticket');

class Tickets extends Array {
    static fromJson(data) {
        let tickets = new Tickets();
        R.forEach((ticket) => { tickets.push(Ticket.fromJson(ticket)); }, data);
        return tickets;
    }
}

module.exports = Tickets;