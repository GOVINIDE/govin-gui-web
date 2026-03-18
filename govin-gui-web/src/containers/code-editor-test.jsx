import React from 'react';
import bindAll from 'lodash.bindall';

import CodeEditorComponentTest from '../components/code-editor/code-editor.jsx';

// eslint-disable-next-line react/prefer-stateless-function
class CodeEditorTest extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSize',
            'containerRef',
            'forceResize'
        ]);
        this.state = {
            clientHeight: null
        };
    }

    componentDidMount () {
        window.addEventListener('resize', this.handleSize);
        // Govin 2.2.0: Expose forceResize globally for console toggle
        window.forceCodeEditorResize = this.forceResize;
    }

    componentWillUnmount () {
        window.removeEventListener('resize', this.handleSize);
    }

    handleSize () {
        this.setState({
            clientHeight: this.containerElement.getBoundingClientRect().height
        });
    }

    // Govin 2.2.0: Force resize calculation
    forceResize () {
        if (this.containerElement) {
            this.setState({
                clientHeight: this.containerElement.getBoundingClientRect().height
            });
        }
    }

    containerRef (el) {
        if (el){
            this.containerElement = el;
            this.setState({
                clientHeight: this.containerElement.getBoundingClientRect().height
            });
        }
    }

    render () {
        const {
            ...props
        } = this.props;
        return (
            <CodeEditorComponentTest
                height={this.state.clientHeight}
                containerRef={this.containerRef}
                {...props}
            />
        );
    }
}

export default CodeEditorTest;
