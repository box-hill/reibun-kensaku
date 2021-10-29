
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function NavSearchBar(props) {
    return (
      <form autoComplete="off">
      <input type="text" maxLength="15" placeholder="Search a phrase..." required
      autoComplete="false" className="nav-search-bar" id="focus"
      onChange={props.handleChange}>
      </input>
      <button className="nav-search-bar-button" onClick={props.search}><FontAwesomeIcon icon={faSearch}/></button>
      </form>
    );
}

export default NavSearchBar;