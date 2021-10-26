import Loader from './Loader';

function Card(props) {
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
                        <div className='card-text'>{result.title}</div>
                        <div><button>Dictionary</button></div>
                    </div>
                    )
                })}
            </div>
        );
    }
}

export default Card;