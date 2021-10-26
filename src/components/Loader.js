function Loader(props) {
    if(props.loading === true){
        return (
        <div className="spinner">
            <div className="bounce1"></div>
            <div className="bounce2"></div>
            <div className="bounce3"></div>
        </div>
        );
    }
    else return null;
}

export default Loader;