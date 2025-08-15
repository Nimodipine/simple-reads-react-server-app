import "./credit.css";

export default function Credit() {
    return (
        <div className="credit-layout">
            <div className="credit-content">
                <div>
                    Wei-Yun Feng, Sujie Zong <br />
                    5610 Summer2 2025
                    <br />
                    <a
                        href="https://github.com/Nimodipine/simple-reads-react-server-app.git"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        https://github.com/Nimodipine/simple-reads-react-server-app.git
                    </a>
                    <br />
                    <a
                        href="https://github.com/SujieZong/simple-reads-node-server-app.git"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        https://github.com/SujieZong/simple-reads-node-server-app.git
                    </a>
                </div>
            </div>
        </div>
    );
}