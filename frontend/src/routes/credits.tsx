import {createFileRoute, Link} from '@tanstack/react-router'
import {Github, CupHotFill} from 'react-bootstrap-icons'

export const Route = createFileRoute('/credits')({
    component: RouteComponent,
    staticData: {
        title: "Ficsit Together | Credits",
        showNav: true,
        requireAuth: false
    }
})

function RouteComponent() {
    return (
        <main className="d-flex justify-content-center px-3 mt-4">
            <div style={{maxWidth: "640px", width: "100%"}}>

                <header className="text-center mb-4">
                    <h1 className="mb-3">Credits</h1>
                    <p className="mb-0">
                        Ficsit Together is an open-source fan project for Satisfactory.
                    </p>
                    <div className="text-muted text-center">
                        Created by <a href="https://github.com/erwtj" className="clickable-link default-purple" target="_blank" rel="noopener noreferrer">
                            Ikno
                        </a> & <a href="https://www.reddit.com/user/Dorito009/" className="clickable-link default-purple" target="_blank" rel="noopener noreferrer">
                            u/Dorito009
                        </a>
                    </div>
                </header>

                <hr/>

                <section className="text-center my-4">
                    <h2 className="text-muted text-uppercase h6 mb-3" style={{letterSpacing: "0.05em", fontSize: "0.8rem"}}>
                        Open Source
                    </h2>
                    <p className="mb-2">
                        <Github className="me-2" style={{marginBottom: ".1rem"}} size={18}/>
                        Check out the code on{' '}
                        <a href="https://github.com/erwtj/FicsitTogether" className="clickable-link default-purple" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                    </p>
                    <p className="text-muted small mb-0">
                        Contributions and feedback are always welcome!
                    </p>
                </section>

                <hr/>

                <section className="text-center my-4">
                    <h2 className="text-muted text-uppercase h6 mb-3" style={{letterSpacing: "0.05em", fontSize: "0.8rem"}}>
                        Legal
                    </h2>
                    <div className="text-muted small">
                        <p className="mb-2">
                            We are not affiliated with or endorsed by Coffee Stain Studios.
                        </p>
                        <p className="mb-2">
                            Satisfactory, the Satisfactory name, logos, and game-related images/assets used in this project are the property of Coffee Stain Studios AB.
                        </p>
                        <p className="mb-0">
                            Everything specific to this app (custom code, layout, and collaboration features) is part of Ficsit Together.
                        </p>
                    </div>
                </section>

                <hr/>

                <footer className="text-center my-4">
                    <p className="text-muted small mb-2">
                        <CupHotFill className="me-2" size={16} style={{marginBottom: ".4rem"}}/>
                        Want to support development?
                    </p>
                    <a href="https://buymeacoffee.com/ikno" className="clickable-link default-purple" target="_blank" rel="noopener noreferrer">
                        Buy us a coffee
                    </a>
                    <p className="text-muted mt-3 mb-0">
                        Learn more <Link to="/about" className="clickable-link default-purple">about Ficsit Together</Link>
                    </p>
                </footer>

            </div>
        </main>
    )
}
