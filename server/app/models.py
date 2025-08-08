from flask_login import UserMixin
import bcrypt

class User(UserMixin):
    def __init__(self, user_doc):
        self.user_doc = user_doc

    def get_id(self):
        return str(self.user_doc['_id'])

    def check_password(self, password_to_check):
        hashed_password = self.user_doc.get('password', b'')
        return bcrypt.checkpw(password_to_check.encode('utf-8'), hashed_password)
    
    @property
    def username(self):
        return self.user_doc.get('username')
    
    @property
    def unique_id(self):
        return self.get_id()