import Loader from './Loader';

function History(props) {
    if(props.loading){
      return (
        <div className='history'>
          <div id='loader'>
            <Loader loading={props.loading}/>
          </div>
        </div>
      );
    }
    if(props.history === null || props.history === undefined){
      return  (
        <div className='history'>
          <div>Try searching something!</div>
        </div>
      );
    }
    if(props.history.length === 0) {
      return  (
        <div className='history'>
          <div className='history-heading'>Recent searches</div>
          <div className='history-table'></div>
        </div>
      );
    }
    if(props.history.length !== 0){
      return (
        <div className='history'>
          <div className='history-heading'>Recent searches</div>
          <div className='history-table'>
            {props.history.map((item, index) => {
              return (<div key={index} className='history-item' id={'past-search-'+index}>
                <div>{item.text}</div>
                <div className="num-results">{item.numResultsFormatted} Matches</div>
              </div>);
            })}
          </div>
        </div>
      );
    }
    return null;
}

export default History;