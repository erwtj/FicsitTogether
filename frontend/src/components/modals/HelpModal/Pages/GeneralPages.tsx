import { useState } from "react";
import {ClientSettingsModal} from "../../ClientSettingsModal.tsx";
import {deleteMe} from "../../../../api/apiCalls.ts";
import {useAuth0Context} from "../../../../auth/useAuth0Context.ts";
import ConfirmationModal from "../../ConfirmationModal.tsx";

export function AccountPageContent() {
    const auth = useAuth0Context();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    
    const deleteAccount = () => {
        deleteMe(auth)
        .then((result) => {
            if (result) {
                auth.logout();
            }
        })
        .catch((error) => {
            console.error("Error deleting account:", error);
        })
    }
    
    return (
        <div>
            <h1>Your Account</h1>
            <p>
                Your account credentials (username, email and password) are stored on <a className="clickable-link default-purple" href="https://auth0.com/">Auth0</a>.
                The only information we store about you is your Auth0 user ID and username, which is used to associate your account with your projects.
            </p>
            <p>
                Only your username is visible to other users when sharing projects, your email and Auth0 user ID are not shared with anyone.
            </p>
            <p>
                <b className="text-warning">It is important</b> to only share your username with people you trust. 
                Any user can share a directory with you if they know your username, and you will be able to see the directory on your home page, unprompted.
            </p>
            <p className="border-start border-3 ps-2 pb-1 text-muted">
                We are planning to add more granular sharing permissions in the future, but for now you should only share your username with people you trust.
            </p>
            
            <h3 className="mt-3">Updating your credentials</h3>
            <p>
                Currently you can not change your username, or email. The password can be changed on the Auth0 login page by clicking on the "Forgot password?" link.
            </p>
            
            <p>
                Your profile picture is fetched from <a className="clickable-link default-purple" href="https://www.gravatar.com/">Gravatar</a> using the email associated with your Auth0 account.
                You can change your profile picture by changing the profile picture associated with your email on Gravatar.
            </p>

            {auth && auth.isAuthenticated && (
                <>
                <div>
                    <h3 className="mt-3">Deleting your account</h3>
                    <p>
                        If you want to delete your account, you can click on the button below.
                        This will <b>permanently</b> delete your account and all your projects and data. This action <b>CAN NOT</b> be undone, so please be sure before you click the button.
                    </p>
                    <button className="btn btn-danger" onClick={() => setShowDeleteConfirmation(true)}>Delete account</button>
                </div>
                    
                    <ConfirmationModal 
                        show={showDeleteConfirmation} 
                        title="Are you sure you want to delete your account?"
                        message="Deleting your account will permanently delete all your projects and data. This action CAN NOT be undone."
                        onConfirm={deleteAccount}
                        onCancel={() => setShowDeleteConfirmation(false)}
                    />
                </>
            )}
        </div>
    );
}

export function SettingsPageContent() {
    const [showSettings, setShowSettings] = useState(false);
    
    return (
        <>
            <div>
                <h1>Client Settings</h1>
                <p>
                    We added some client settings to customize your experience.
                    You can open the settings dialog by clicking on your profile picture and using the settings button, or by clicking the gear icon from the project side panel.            
                </p>
                
                <button className="clickable-link default-purple p-0 border-0 bg-transparent mb-3" onClick={() => setShowSettings(true)}>Or click here.</button>
                
                <p>Currently, the available client settings include:</p>
                
                <ul>
                    <li><strong>Minimap:</strong> Show or hide the minimap in the project editor.</li>
                    <li><strong>Controls</strong> Show or hide control buttons, useful on mobile.</li>
                    <li><strong>Tooltips:</strong> Show tooltips when hovering over certain elements.</li>
                    <li><strong>Snapping:</strong> Enable or disable snapping to grid when moving nodes in the project editor.</li>
                    <li><strong>I/O Summing:</strong> Enable input/output summing in the side panel.</li>
                    <li><strong>Show water/photon usage:</strong> Show water usage and excited photonic matter usage on overview page.</li>
                    <li><strong>Show usernames/emails:</strong> Show usernames and emails, turn off when streaming for privacy.</li>
                </ul>
                
                <p className="border-start border-3 ps-2 pb-1 text-muted">
                    These client settings are configured per-browser and are not shared across devices. 
                    They are stored locally in your browser's storage and will persist across sessions, but they will not be available if you switch to a different browser or device.
                </p>
            </div>
            
            <ClientSettingsModal show={showSettings} handleClose={() => setShowSettings(false)} />
        </>
    );
}

export function TroubleshootingPageContent() {
    return (
        <div>
            <h1>Troubleshooting</h1>
            <p>If you find any issues that you deem important, please report them on <a className="clickable-link default-purple" href="https://github.com/erwtj/FicsitTogether/issues">GitHub</a>.</p>
        </div>
    );
}