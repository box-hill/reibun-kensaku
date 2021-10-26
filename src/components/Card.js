import Loader from './Loader';

function Card(props) {
    // The results with <b> tags contain the search term
    // If neither the htmlSnippet or htmlTitle contains this, then the hit is likely a bad one
    function retrieveStringInItem(resultObj) {
        function replaceTagInString(inputString){
            const regex = new RegExp("<b>.*</b>", "g");
            const outputString = inputString.replaceAll(regex, props.searchInput)
            console.log(outputString);
            return outputString;
        }
        if(resultObj.htmlSnippet.includes("<b>")){
            return replaceTagInString(resultObj.htmlSnippet);
        }
        if(resultObj.htmlTitle.includes("<b>")){
            return replaceTagInString(resultObj.htmlTitle);
        }
        // else no good match can be found, exclude hit from results
        return null;
    }
    
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
    if(props.results === undefined) {
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
    if(props.results.length === 0){
        return (
            <div className='results-container'>Welcome to my website!</div>
        );
    }
    else {
        return (
            <div className='results-container'>
                {props.results.map((result, index) => {
                    return (
                    <div key={index} className='card'>
                        <div>{retrieveStringInItem(result)}</div>
                        <div className='card-text'>{result.htmlSnippet}</div>
                        <div><button>Dictionary(?)</button></div>
                    </div>
                    )
                })}
            </div>
        );
    }
}

export default Card;