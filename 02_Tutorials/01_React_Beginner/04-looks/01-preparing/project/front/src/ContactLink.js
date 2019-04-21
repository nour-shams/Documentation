import React from 'react'
import { Link } from "react-router-dom";

const ContactLink = ({ id, name, email, image, style }) => (
  <div className="contact-link" style={style}>
    {image ? (
      <img
        className="contact-link__avatar-image"
        src={`//localhost:8080/images/${image}`}
        alt={`the avatar of ${name}`}
      />
    ) : (
      <div className="contact-link__avatar-letter">
        <span>{name[0].toUpperCase()}</span>
      </div>
    )}
    <Link className="contact-link__text" to={"/contact/" + id}>
      <span className="contact-link__text__name">{name}</span>
      <span className="contact-link__text__email">{email}</span>
    </Link>
  </div>
);

export default ContactLink