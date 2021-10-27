import Loader from './Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

function Card(props) {

    
    function retrieveSentenceInString(string){
        // retrieve the sentence from the String.
    }

    if(props.loading === true) {
        return (
        <div className='results-container'>
            <div id='loader'>
                <Loader loading={props.loading}/>
            </div>
        </div>);
    }
    if(props.parsedResults === undefined) {
      return (
        <div id='error-center' className='results-container'>
          <div className='error-emoji'>(╯°□°)╯︵ ┻━┻</div>
          <div>Can't find any matching sentences.</div>
          <div>Try changing your search.</div>
          <div className='error-jap'>フレーズに該当する例文が見つかりません。</div>
          <div>フレーズを変更して検索してください。</div>
        </div>
      );
    }
    if(props.parsedResults === 'API key limit reached') {
        return (
            <div id='error-center' className='results-container'>
              <div className='error-emoji'>(╯°□°)╯︵ ┻━┻</div>
              <div>API Key limit Reached.</div>
            </div>
          );
    }
    if(props.parsedResults.length === 0){
        return (
            <div className='results-container'>Welcome to my website!</div>
        );
    }
    else {
        return (
            <div className='results-container'>
                {props.parsedResults.map((result, index) => {
                    if(result.text !== null){
                        return (
                        <div key={index} className='card'>
                            <div className='card-text'>{result.start}<b>{result.searchedPhrase}</b>{result.end}</div>
                            <a href={result.link} target="_blank" className="icon"><FontAwesomeIcon icon={faLink}/> </a>
                        </div>)
                    }
                })}
            </div>
        );
    }
}

export default Card;