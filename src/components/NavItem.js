import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

function NavItem(props) {
    if(!props.initialLogin) return null;
    return (
      <li className="nav-item">
        <button herf="#" className="nav-button" onClick={props.onClick}>
          <div className="text-button"><FontAwesomeIcon icon={props.icon}/>{props.text}</div>
        </button>
      </li>
    );
}

export default NavItem;