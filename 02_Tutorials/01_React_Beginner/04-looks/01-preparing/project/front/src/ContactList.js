import React from "react";
import { Transition } from "react-spring"; // you can remove this from App.js
import ContactLink from './ContactLink'

const ContactList = ({ contacts_list }) => (
  <div className="contact-list">
    <Transition
      className="contact-list"
      items={contacts_list}
      keys={contact => contact.id}
      from={{ transform: "translate3d(-100px,0,0)" }}
      enter={{ transform: "translate3d(0,0px,0)" }}
      leave={{ transform: "translate3d(-100px,0,0)" }}
      >
      {contact => style => <ContactLink style={style} {...contact} />}
    </Transition>
  </div>
);

export default ContactList;
