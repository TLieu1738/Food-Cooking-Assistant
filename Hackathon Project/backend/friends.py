from flask import Blueprint, request, jsonify
from dbClient import supabase

friends_bp = Blueprint("friends", __name__)


